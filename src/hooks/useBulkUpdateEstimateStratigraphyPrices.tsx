import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { computeStratigraphyCosts } from '@/components/configurator-v2/hooks/computeStratigraphyCosts';
import type { LayerV2 } from '@/components/configurator-v2/types';

interface BulkUpdateParams {
  estimateStratigraphies: EstimateStratigraphy[];
  /**
   * Se true, il toast riassuntivo dell'onSuccess viene saltato. Usato dai
   * chiamanti single-row (es. useEstimateStratigraphies.updateStratigraphyPrices)
   * che mostrano un toast più specifico col delta prezzo.
   */
  silentToast?: boolean;
}

export type BulkUpdateSkipReason =
  /** Manca il riferimento alla stratigrafia originale (snapshot orfano da V1 o post-eliminazione). */
  | 'no_original_stratigraphy'
  /** La stratigrafia originale è stata eliminata dal catalogo. */
  | 'original_not_found'
  /** Composizione corrotta o vuota: ricalcolo darebbe 0, non sovrascrivo. */
  | 'zero_cost_recalc'
  /** Nessun layer valido trovato (tutti senza materiale o spessore 0). */
  | 'no_valid_layers';

export interface BulkUpdateRowOk {
  id: string;
  name: string;
  oldCost: number;
  newCost: number;
  changed: boolean; // true se la differenza > 0.01€
}

export interface BulkUpdateRowSkipped {
  id: string;
  name: string;
  reason: BulkUpdateSkipReason;
  /** Per zero_cost_recalc: dettaglio sui layer invalidi/totali. */
  detail?: string;
}

export interface BulkUpdateRowFailed {
  id: string;
  name: string;
  error: string;
}

export interface BulkUpdateReport {
  estimateId: string;
  updated: BulkUpdateRowOk[];
  skipped: BulkUpdateRowSkipped[];
  failed: BulkUpdateRowFailed[];
  costPerHour: number;
}

const SKIP_REASON_LABEL: Record<BulkUpdateSkipReason, string> = {
  no_original_stratigraphy: 'Snapshot orfano (manca riferimento al catalogo)',
  original_not_found: 'Stratigrafia originale eliminata dal catalogo',
  zero_cost_recalc: 'Ricalcolo darebbe 0€ (composizione corrotta)',
  no_valid_layers: 'Nessun layer valido nella stratigrafia',
};

export function bulkUpdateSkipReasonLabel(reason: BulkUpdateSkipReason): string {
  return SKIP_REASON_LABEL[reason];
}

/**
 * Aggiornamento bulk dei prezzi delle stratigrafie di un preventivo.
 *
 * Ricalcola dinamicamente costo materiali + viti + manodopera con il
 * `cost_per_hour` corrente (da `configurator_settings`), poi aggiorna lo
 * snapshot in `estimate_stratigraphies` (unit_cost, total_cost,
 * stratigraphy_data, layers_data, prices_updated_at).
 *
 * Ritorna un report strutturato con esiti per riga: il chiamante può
 * mostrare un dialog onesto invece della vecchia progress bar fake.
 *
 * Sicurezza: blocca se preventivo `contracted` o se l'utente non possiede
 * il progetto.
 */
export const useBulkUpdateEstimateStratigraphyPrices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation<BulkUpdateReport, Error, BulkUpdateParams>({
    mutationFn: async ({ estimateStratigraphies }) => {
      if (!user) throw new Error('User not authenticated');
      if (estimateStratigraphies.length === 0) {
        throw new Error('Nessuna stratigrafia da aggiornare');
      }

      const estimateId = estimateStratigraphies[0].estimateId;

      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('status, project_id')
        .eq('id', estimateId)
        .single();
      if (estimateError) throw new Error('Preventivo non trovato');
      if (estimateData.status === 'contracted') {
        throw new Error('Impossibile aggiornare prezzi: preventivo contrattualizzato');
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.project_id)
        .eq('user_id', user.id)
        .single();
      if (projectError || !projectData) throw new Error('Accesso negato al progetto');

      // Costo orario corrente: letto UNA volta sola per il batch, non per riga.
      const { data: settingData, error: settingError } = await supabase
        .from('configurator_settings')
        .select('value')
        .eq('key', 'cost_per_hour')
        .maybeSingle();
      if (settingError) throw new Error('Errore nel recupero del costo orario corrente');
      const costPerHour = parseFloat(settingData?.value || '30') || 30;

      const updated: BulkUpdateRowOk[] = [];
      const skipped: BulkUpdateRowSkipped[] = [];
      const failed: BulkUpdateRowFailed[] = [];

      for (const estStrat of estimateStratigraphies) {
        if (!estStrat.originalStratigraphyId) {
          skipped.push({ id: estStrat.id, name: estStrat.name, reason: 'no_original_stratigraphy' });
          continue;
        }

        try {
          const { data: original, error: stratigraphyError } = await supabase
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
                screw_cost_per_sqm,
                screw_quantity,
                material_cost_per_sqm,
                labor_cost_per_sqm,
                labor_cost_per_hour,
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
                  width,
                  weight_per_sqm,
                  thermal_conductivity,
                  acoustic_performance,
                  fire_resistance_class,
                  installation_time_per_sqm,
                  waste_percentage
                ),
                screw_materials:materials!layers_screw_material_id_fkey (
                  id,
                  name,
                  unit_price,
                  code,
                  supplier,
                  unit,
                  length,
                  box_pieces,
                  installation_time_per_sqm,
                  waste_percentage
                )
              )
            `)
            .eq('id', estStrat.originalStratigraphyId)
            .maybeSingle();

          if (stratigraphyError) {
            failed.push({ id: estStrat.id, name: estStrat.name, error: stratigraphyError.message });
            continue;
          }
          if (!original) {
            skipped.push({ id: estStrat.id, name: estStrat.name, reason: 'original_not_found' });
            continue;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbLayers: any[] = original.layers ?? [];
          if (dbLayers.length === 0) {
            skipped.push({ id: estStrat.id, name: estStrat.name, reason: 'no_valid_layers' });
            continue;
          }

          // 🔥 F19.4 — Override unit_price col NETTO da materials_with_pricing.
          // Il join via FK carica `materials` raw dove unit_price = list_price
          // perché il trigger di recompute filtra per organization_id (i
          // materiali catalogo globale hanno org=NULL → non vengono mai
          // ricomputati). La view applica gli sconti famiglia + extra
          // correttamente per l'org corrente (RLS).
          const layerMatIds: string[] = [];
          for (const dbL of dbLayers) {
            if (dbL.materials?.id) layerMatIds.push(dbL.materials.id);
            if (dbL.screw_materials?.id) layerMatIds.push(dbL.screw_materials.id);
          }
          const uniqueLayerMatIds = Array.from(new Set(layerMatIds));
          const layerPriceMap = new Map<string, number>();
          if (uniqueLayerMatIds.length > 0) {
            const { data: pricing } = await supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from('materials_with_pricing' as any)
              .select('id, unit_price')
              .in('id', uniqueLayerMatIds);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const p of (pricing ?? []) as any[]) {
              layerPriceMap.set(p.id, Number(p.unit_price ?? 0));
            }
          }
          for (const dbL of dbLayers) {
            if (dbL.materials?.id && layerPriceMap.has(dbL.materials.id)) {
              dbL.materials.unit_price = layerPriceMap.get(dbL.materials.id);
            }
            if (dbL.screw_materials?.id && layerPriceMap.has(dbL.screw_materials.id)) {
              dbL.screw_materials.unit_price = layerPriceMap.get(dbL.screw_materials.id);
            }
          }

          // Conta layer validi e blocca se vuoti.
          const validLayerCount = dbLayers.filter(
            (l) => !!l.materials && Number(l.thickness ?? 0) > 0,
          ).length;
          if (validLayerCount === 0) {
            skipped.push({
              id: estStrat.id,
              name: estStrat.name,
              reason: 'no_valid_layers',
              detail: `${dbLayers.length} layer senza materiale/spessore`,
            });
            continue;
          }

          // Costruisci LayerV2[] dai layer DB e usa la STESSA formula del
          // preview/save (computeStratigraphyCosts, category-aware).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sortedDbLayers = [...dbLayers].sort((a: any, b: any) => a.position - b.position);
          const layersForCompute = sortedDbLayers.map((dbL, idx) => ({
            id: dbL.id ?? `tmp-${idx}`,
            position: idx + 1,
            materialId: dbL.material_id ?? null,
            material: dbL.materials ?? null,
            thickness: Number(dbL.thickness ?? 0),
            interAxis: dbL.inter_axis ?? undefined,
            screwMaterialId: dbL.screw_material_id ?? null,
            screwMaterial: dbL.screw_materials ?? null,
            screwQuantity: dbL.screw_quantity ?? undefined,
            screwCostPerSqm: dbL.screw_cost_per_sqm ?? undefined,
          })) as unknown as LayerV2[];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const studSpacingMm = Number((original as any).stud_spacing_mm ?? 600);
          const breakdown = computeStratigraphyCosts(layersForCompute, studSpacingMm, costPerHour);

          const result = {
            materialCost: Math.round(breakdown.subtotalMaterials * 1000) / 1000,
            screwCost: Math.round(breakdown.subtotalScrews * 1000) / 1000,
            laborCost: Math.round(breakdown.laborCost * 1000) / 1000,
            installationTime: Math.round(breakdown.laborMinutes * 1000) / 1000,
            comprehensiveCost: Math.round(breakdown.totalCost * 100) / 100,
          };

          // Protezione: NON sovrascrivere il preventivo con 0€. Marca come da
          // revisionare invece. Capita quando la stratigrafia originale è
          // corrotta (materials cancellati, prezzi azzerati, ecc.).
          if (result.comprehensiveCost <= 0) {
            skipped.push({
              id: estStrat.id,
              name: estStrat.name,
              reason: 'zero_cost_recalc',
              detail: `${validLayerCount} layer validi ma costo totale calcolato = 0€`,
            });
            continue;
          }

          // F7.7 + F9.5: ricalcola finish_cost dai componenti snapshot coi
          // prezzi correnti (i materiali finitura possono aver cambiato prezzo)
          // e rinfresca il waste_percentage per ogni componente snapshot.
          // F20.6: includi SEMPRE la labor anche se finish_components_data è
          // vuoto. Livelli come Q1/Q2 hanno solo labor (no materiali BOM) e
          // il create li conta — il bulk update prima li ignorava, generando
          // divergenza identica al costo labor finitura (es. 10min × 30€/h = 5€).
          let newFinishCost = 0;
          let newFinishLaborMin: number | null = null;
          let refreshedFinishComponents: Array<Record<string, unknown>> | null = null;
          const { data: currentRow } = await supabase
            .from('estimate_stratigraphies')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .select('finish_level, finish_components_data, finish_labor_minutes_per_sqm' as any)
            .eq('id', estStrat.id)
            .maybeSingle();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const finishSnap = (currentRow as any)?.finish_components_data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newFinishLaborMin = (currentRow as any)?.finish_labor_minutes_per_sqm ?? null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasFinishLevel = !!(currentRow as any)?.finish_level;
          const hasComponents = Array.isArray(finishSnap) && finishSnap.length > 0;
          // Calcola se: ha components OPPURE ha un livello finitura con labor.
          if (hasComponents || (hasFinishLevel && (newFinishLaborMin ?? 0) > 0)) {
            let materialsCost = 0;
            if (hasComponents) {
              const matIds = (finishSnap as Array<Record<string, unknown>>)
                .map((c) => c.material_id as string | undefined)
                .filter((x): x is string => !!x);
              const priceMap = new Map<string, { unit_price?: number; unit?: string; box_pieces?: number; waste_percentage?: number | null }>();
              if (matIds.length > 0) {
                const { data: freshMats } = await supabase
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .from('materials_with_pricing' as any)
                  .select('id, unit_price, unit, box_pieces, waste_percentage')
                  .in('id', matIds);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                for (const m of (freshMats ?? []) as any[]) {
                  priceMap.set(m.id, m);
                }
              }
              refreshedFinishComponents = [];
              for (const c of finishSnap as Array<Record<string, unknown>>) {
                const fresh = priceMap.get(c.material_id as string);
                const unitPrice = Number(fresh?.unit_price ?? c.unit_price ?? 0);
                const unit = String(fresh?.unit ?? c.material_unit ?? '').toLowerCase().trim();
                const box = Number(fresh?.box_pieces ?? c.box_pieces ?? 0);
                const pricePerUsage = (unit === 'scatola' && box > 0) ? unitPrice / box : unitPrice;
                materialsCost += Number(c.quantity_per_sqm ?? 0) * pricePerUsage;
                refreshedFinishComponents.push({
                  ...c,
                  unit_price: unitPrice,
                  material_unit: unit || c.material_unit,
                  box_pieces: box > 0 ? box : (c.box_pieces ?? null),
                  waste_percentage: fresh?.waste_percentage ?? null,
                });
              }
            }
            const laborCost = ((newFinishLaborMin ?? 0) * costPerHour) / 60;
            newFinishCost = Math.round((materialsCost + laborCost) * 10000) / 10000;
          }

          const newUnitCost = Math.round((result.comprehensiveCost + newFinishCost) * 100) / 100;
          const newTotalCost = Math.round(estStrat.area * newUnitCost * 100) / 100;

          // Snapshot composition aggiornato col nuovo breakdown.
          const updatedStratigraphyData = {
            ...original,
            material_cost_per_sqm: result.materialCost,
            screw_cost_per_sqm: result.screwCost,
            labor_cost_per_sqm: result.laborCost,
            comprehensive_cost_per_sqm: result.comprehensiveCost,
            installation_time_per_sqm: result.installationTime,
            cost_per_sqm: result.comprehensiveCost,
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sortedLayers = [...dbLayers].sort((a: any, b: any) => a.position - b.position);

          const updatePayload: Record<string, unknown> = {
            unit_cost: newUnitCost,
            total_cost: newTotalCost,
            stratigraphy_data: updatedStratigraphyData,
            layers_data: sortedLayers,
            finish_cost_per_sqm: newFinishCost > 0 ? newFinishCost : null,
            ...(refreshedFinishComponents ? { finish_components_data: refreshedFinishComponents } : {}),
            prices_updated_at: new Date().toISOString(),
          };
          const { error: updateError } = await supabase
            .from('estimate_stratigraphies')
            .update(updatePayload)
            .eq('id', estStrat.id);

          if (updateError) {
            failed.push({ id: estStrat.id, name: estStrat.name, error: updateError.message });
            continue;
          }

          updated.push({
            id: estStrat.id,
            name: estStrat.name,
            oldCost: estStrat.unitCost,
            newCost: newUnitCost,
            changed: Math.abs(estStrat.unitCost - newUnitCost) > 0.01,
          });
        } catch (err) {
          failed.push({
            id: estStrat.id,
            name: estStrat.name,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return { estimateId, updated, skipped, failed, costPerHour };
    },
    onSuccess: (report, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-stratigraphies', report.estimateId] });
      queryClient.invalidateQueries({ queryKey: ['estimate', report.estimateId] });
      // Toast riassuntivo conciso. Il dialog di esito viene mostrato dal
      // componente chiamante (EstimateStratigraphiesSection) usando il report.
      // I chiamanti single-row passano silentToast=true per gestirlo loro.
      if (variables.silentToast) return;
      const realChanges = report.updated.filter(r => r.changed).length;
      if (realChanges > 0) {
        toast.success(`${realChanges} stratigrafie aggiornate con prezzi modificati`);
      } else if (report.updated.length > 0) {
        toast.info(`${report.updated.length} stratigrafie verificate, prezzi già aggiornati`);
      } else if (report.skipped.length > 0 && report.failed.length === 0) {
        toast.warning('Nessuna stratigrafia aggiornata: vedi dettagli');
      }
    },
    onError: (error) => {
      console.error('[useBulkUpdateEstimateStratigraphyPrices] error:', error);
      const msg = error.message?.includes('contrattualizzato')
        ? 'Impossibile aggiornare prezzi: preventivo contrattualizzato'
        : `Errore aggiornamento prezzi: ${error.message ?? 'sconosciuto'}`;
      toast.error(msg);
    },
  });

  return {
    bulkUpdatePrices: bulkUpdateMutation.mutate,
    /** Variante async: ritorna il report strutturato (per UI di esito). */
    bulkUpdatePricesAsync: bulkUpdateMutation.mutateAsync,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
};
