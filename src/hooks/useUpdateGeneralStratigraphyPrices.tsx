
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { computeStratigraphyCosts } from '@/components/configurator-v2/hooks/computeStratigraphyCosts';
import type { LayerV2 } from '@/components/configurator-v2/types';

export const useUpdateGeneralStratigraphyPrices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateGeneralPricesMutation = useMutation({
    mutationFn: async ({ stratigraphyId }: { stratigraphyId: string }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('[useUpdateGeneralStratigraphyPrices] 🚨🚨🚨 CHIAMATO PER STRATIGRAFIA GENERALE:', stratigraphyId);
      console.trace('[useUpdateGeneralStratigraphyPrices] STACK TRACE - Chi mi ha chiamato?');

      console.log('[useUpdateGeneralStratigraphyPrices] 🔄 Updating prices for:', stratigraphyId);

      // 🔥 LEGGI IL COSTO ORARIO DAL DATABASE (IDENTICO A useIntegratedStratigraphySave)
      const { data: settingData, error: settingError } = await supabase
        .from('configurator_settings')
        .select('value')
        .eq('key', 'cost_per_hour')
        .single();

      if (settingError) {
        console.error('[useUpdateGeneralStratigraphyPrices] ❌ Error fetching cost_per_hour:', settingError);
        throw new Error('Errore nel recupero del costo orario');
      }

      const costPerHour = parseFloat(settingData?.value || '30');
      console.log('[useUpdateGeneralStratigraphyPrices] 💰 COSTO ORARIO DAL DB:', costPerHour);

      // Get current stratigraphy with all layers and materials
      const { data: stratigraphy, error: fetchError } = await supabase
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
            materials!layers_material_id_fkey (
              id,
              name,
              category,
              unit,
              unit_price,
              incidence_per_sqm,
              incidence_base,
              width,
              installation_time_per_sqm
            ),
            screw_materials:materials!layers_screw_material_id_fkey (
              id,
              name,
              unit_price,
              installation_time_per_sqm
            )
          )
        `)
        .eq('id', stratigraphyId)
        .single();

      if (fetchError) {
        console.error('[useUpdateGeneralStratigraphyPrices] ❌ Error fetching stratigraphy:', fetchError);
        throw fetchError;
      }

      console.log('[useUpdateGeneralStratigraphyPrices] 📋 Stratigraphy data loaded:', stratigraphy.name);

      // 🔥 F19.4 — Override unit_price col NETTO da materials_with_pricing.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbLayers: any[] = stratigraphy.layers ?? [];
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

      // Costruisci LayerV2[] e usa la STESSA formula di preview/save/bulk.
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
      const studSpacingMm = Number((stratigraphy as any).stud_spacing_mm ?? 600);
      const breakdown = computeStratigraphyCosts(layersForCompute, studSpacingMm, costPerHour);

      const materialCost = breakdown.subtotalMaterials;
      const screwCost = breakdown.subtotalScrews;
      const laborCost = breakdown.laborCost;
      const totalInstallTime = breakdown.laborMinutes;
      const newCostPerSqm = Math.round(breakdown.totalCost * 100) / 100;

      console.log('[useUpdateGeneralStratigraphyPrices] 🧮 COMPREHENSIVE COST BREAKDOWN (computeStratigraphyCosts):', {
        materialCost: Math.round(materialCost * 1000) / 1000,
        screwCost: Math.round(screwCost * 1000) / 1000,
        laborCost: Math.round(laborCost * 1000) / 1000,
        comprehensive: newCostPerSqm,
      });

      // Update the general stratigraphy with new comprehensive cost
      const { data: result, error: updateError } = await supabase
        .from('stratigraphies')
        .update({
          material_cost_per_sqm: Math.round(materialCost * 1000) / 1000,
          screw_cost_per_sqm: Math.round(screwCost * 1000) / 1000,
          labor_cost_per_sqm: Math.round(laborCost * 1000) / 1000,
          comprehensive_cost_per_sqm: newCostPerSqm,
          installation_time_per_sqm: Math.round(totalInstallTime * 1000) / 1000,
          cost_per_sqm: newCostPerSqm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stratigraphyId)
        .select()
        .single();

      if (updateError) {
        console.error('[useUpdateGeneralStratigraphyPrices] ❌ Error updating prices:', updateError);
        throw updateError;
      }

      console.log('[useUpdateGeneralStratigraphyPrices] ✅ Successfully updated stratigraphy with comprehensive cost');
      return result;
    },
    onSuccess: (data) => {
      console.log('[useUpdateGeneralStratigraphyPrices] 🎉 Price update successful, invalidating queries...');
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['unified-stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['stratigraphies'] });
      toast.success('Prezzi della stratigrafia aggiornati con costi completi!');
    },
    onError: (error) => {
      console.error('[useUpdateGeneralStratigraphyPrices] ❌ Error updating prices:', error);
      toast.error('Errore nell\'aggiornamento dei prezzi della stratigrafia');
    },
  });

  return {
    updateGeneralStratigraphyPrices: (stratigraphyId: string) => 
      updateGeneralPricesMutation.mutate({ stratigraphyId }),
    isUpdatingGeneralPrices: updateGeneralPricesMutation.isPending,
  };
};
