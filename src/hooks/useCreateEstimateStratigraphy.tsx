
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { CreateEstimateStratigraphyData } from '@/types/estimateStratigraphy';

/**
 * Fetcha il livello finitura (Q1-Q4) + componenti per l'org corrente,
 * calcola costo finitura €/m² e ritorna anche lo snapshot della BOM.
 * F7.7.
 */
async function fetchFinishCostSnapshot(
  organizationId: string,
  finishLevelCode: string,
): Promise<{
  finishCostPerSqm: number;
  finishLaborMinPerSqm: number;
  finishComponentsSnapshot: Array<Record<string, unknown>>;
} | null> {
  // 1) Costo orario
  const { data: settingData } = await supabase
    .from('configurator_settings')
    .select('value')
    .eq('key', 'cost_per_hour')
    .maybeSingle();
  const hourlyRate = parseFloat(settingData?.value ?? '30') || 30;

  // 2) Livello finitura
  const { data: level, error: levelError } = await supabase
    .from('finish_levels')
    .select('id, code, labor_minutes_per_sqm')
    .eq('organization_id', organizationId)
    .eq('code', finishLevelCode)
    .maybeSingle();
  if (levelError || !level) {
    console.warn('[fetchFinishCostSnapshot] livello non trovato:', finishLevelCode);
    return null;
  }

  // 3) Componenti BOM con materiali joined
  const { data: components } = await supabase
    .from('finish_level_components')
    .select(`
      id,
      quantity_per_sqm,
      notes,
      material:materials!finish_level_components_material_id_fkey (
        id, name, code, unit, unit_price, supplier, category, box_pieces, waste_percentage
      )
    `)
    .eq('finish_level_id', level.id);

  // 🔥 F20.2 — Override unit_price col NETTO da materials_with_pricing.
  // Il join via FK carica `materials` raw dove unit_price = list_price
  // (vedi commento in useStratigraphy.ts / useBulkUpdateEstimateStratigraphyPrices).
  type FinishCompWithMat = { material?: { id?: string; unit_price?: number | null } | null };
  const compsArr = (components ?? []) as FinishCompWithMat[];
  const finishMatIds = compsArr
    .map((c) => c.material?.id)
    .filter((x: string | undefined): x is string => !!x);
  const uniqueFinishMatIds = Array.from(new Set(finishMatIds));
  if (uniqueFinishMatIds.length > 0) {
    const { data: pricing } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('materials_with_pricing' as any)
      .select('id, unit_price')
      .in('id', uniqueFinishMatIds);
    const priceMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (pricing ?? []) as any[]) {
      priceMap.set(p.id, Number(p.unit_price ?? 0));
    }
    for (const c of compsArr) {
      if (c.material?.id && priceMap.has(c.material.id)) {
        c.material.unit_price = priceMap.get(c.material.id);
      }
    }
  }

  // 4) Calcolo costo materiali
  let materialsCost = 0;
  const snapshot: Array<Record<string, unknown>> = [];
  for (const c of compsArr) {
    const mat = c.material;
    if (!mat) continue;
    const unitPrice = Number(mat.unit_price ?? 0);
    const unit = String(mat.unit ?? '').toLowerCase().trim();
    const box = Number(mat.box_pieces ?? 0);
    const pricePerUsage = (unit === 'scatola' && box > 0) ? unitPrice / box : unitPrice;
    const qty = Number(c.quantity_per_sqm ?? 0);
    const rowCost = qty * pricePerUsage;
    materialsCost += rowCost;
    snapshot.push({
      material_id: mat.id,
      material_name: mat.name,
      material_code: mat.code,
      material_unit: mat.unit,
      material_supplier: mat.supplier,
      unit_price: unitPrice,
      box_pieces: mat.box_pieces,
      quantity_per_sqm: qty,
      cost_per_sqm: Math.round(rowCost * 10000) / 10000,
      waste_percentage: mat.waste_percentage ?? null,
      notes: c.notes,
    });
  }

  const laborMin = Number(level.labor_minutes_per_sqm) || 0;
  const laborCost = (laborMin * hourlyRate) / 60;
  const totalCost = materialsCost + laborCost;

  return {
    finishCostPerSqm: Math.round(totalCost * 10000) / 10000,
    finishLaborMinPerSqm: laborMin,
    finishComponentsSnapshot: snapshot,
  };
}

export const useCreateEstimateStratigraphy = () => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  const createEstimateStratigraphyMutation = useMutation({
    mutationFn: async (data: CreateEstimateStratigraphyData) => {
      if (!user) throw new Error('User not authenticated');

      // PROTEZIONE: Verifica lo stato del preventivo prima di procedere
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('status, project_id')
        .eq('id', data.estimateId)
        .single();

      if (estimateError) {
        console.error('Error fetching estimate for validation:', estimateError);
        throw new Error('Preventivo non trovato');
      }

      // F30: blocca se il preventivo è vinto/perso (o legacy contracted).
      if (estimateData.status === 'won' || estimateData.status === 'lost' || estimateData.status === 'contracted') {
        const label = estimateData.status === 'lost' ? 'perso' : 'vinto/contrattualizzato';
        throw new Error(`Impossibile aggiungere stratigrafie: preventivo ${label}`);
      }

      // Verifica che il progetto appartenga all'utente
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectData) {
        throw new Error('Accesso negato al progetto');
      }

      // First, get the complete stratigraphy data with layers and materials (including custom_screws)
      const { data: stratigraphySnapshot, error: snapshotError } = await supabase
        .from('stratigraphies')
        .select(`
          *,
          layers (
            id,
            position,
            thickness,
            inter_axis,
            material_id,
            screw_material_id,
            screw_quantity,
            screw_cost_per_sqm,
            material_cost_per_sqm,
            installation_time_minutes,
            materials!layers_material_id_fkey (
              id,
              name,
              category,
              unit,
              unit_price,
              incidence_per_sqm,
              color_hex,
              supplier,
              code,
              description,
              weight_per_sqm,
              thermal_conductivity,
              acoustic_performance,
              fire_resistance_class,
              compatible_board_types,
              length,
              box_pieces,
              installation_time_per_sqm,
              waste_percentage
            ),
            screw_materials:materials!layers_screw_material_id_fkey (
              id,
              name,
              category,
              unit,
              unit_price,
              incidence_per_sqm,
              color_hex,
              supplier,
              code,
              description,
              length,
              box_pieces,
              installation_time_per_sqm,
              waste_percentage
            )
          )
        `)
        .eq('id', data.stratigraphyId)
        .single();

      if (snapshotError) {
        console.error('Error fetching stratigraphy snapshot:', snapshotError);
        throw snapshotError;
      }

      // F7.7: calcola costo finitura se livello specificato + org disponibile
      let finishSnapshot: Awaited<ReturnType<typeof fetchFinishCostSnapshot>> = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finishLevelCode = (data as any).finishLevel as string | undefined;
      if (finishLevelCode && currentOrganizationId) {
        finishSnapshot = await fetchFinishCostSnapshot(currentOrganizationId, finishLevelCode);
      }

      // Sommiamo il finish_cost al unit_cost: il preventivo è "tutto incluso"
      // (parete + finitura). L'utente vede un €/m² unico.
      // F20.7: arrotonda unit_cost a 2 decimali PRIMA di calcolare il totale,
      // identico al bulk update. Senza questo, "Aggiorna prezzi" produrrebbe
      // un total_cost diverso (centesimi di delta su totali grandi).
      const finishCostPerSqm = finishSnapshot?.finishCostPerSqm ?? 0;
      const finalUnitCost = Math.round((Number(data.unitCost) + finishCostPerSqm) * 100) / 100;
      const totalCost = Math.round(data.area * (data.quantity || 1) * finalUnitCost * 100) / 100;

      const { data: result, error } = await supabase
        .from('estimate_stratigraphies')
        .insert({
          estimate_id: data.estimateId,
          stratigraphy_id: data.stratigraphyId,
          name: data.name,
          description: data.description,
          area: data.area,
          quantity: data.quantity || 1,
          unit_cost: finalUnitCost,
          total_cost: totalCost,
          // F7.7: livello + costo + snapshot BOM (per recalcolo prezzi futuro)
          finish_level: finishLevelCode ?? null,
          finish_cost_per_sqm: finishCostPerSqm,
          finish_labor_minutes_per_sqm: finishSnapshot?.finishLaborMinPerSqm ?? null,
          finish_components_data: finishSnapshot?.finishComponentsSnapshot ?? null,
          // New snapshot fields including custom_screws data
          stratigraphy_data: stratigraphySnapshot,
          layers_data: (stratigraphySnapshot.layers ?? []).slice().sort(
            (a: { position: number }, b: { position: number }) => a.position - b.position,
          ),
          prices_updated_at: new Date().toISOString(),
          is_snapshot: true,
          original_stratigraphy_id: data.stratigraphyId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating estimate stratigraphy:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
      toast.success('Stratigrafia aggiunta al preventivo!');
    },
    onError: (error) => {
      console.error('Error creating estimate stratigraphy:', error);
      if (error.message.includes('contrattualizzato')) {
        toast.error('Impossibile aggiungere: preventivo contrattualizzato');
      } else {
        toast.error('Errore nell\'aggiunta della stratigrafia');
      }
    },
  });

  return {
    createEstimateStratigraphy: createEstimateStratigraphyMutation.mutate,
    isCreating: createEstimateStratigraphyMutation.isPending,
  };
};
