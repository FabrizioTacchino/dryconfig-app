
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
              installation_time_per_sqm
            ),
            screw_materials:materials!layers_screw_material_id_fkey (
              id,
              name,
              unit_price
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

      // 🔥 USE THE SAME LOGIC AS useIntegratedStratigraphySave for consistent results
      let materialCost = 0;
      let screwCost = 0;
      let totalInstallTime = 0;
      
      if (stratigraphy.layers && Array.isArray(stratigraphy.layers)) {
        stratigraphy.layers.forEach((layer: any) => {
          if (layer.materials && layer.thickness > 0) {
            // Base material cost (same logic as save)
            const unitPrice = layer.materials.unit_price || 0;
            const incidence = layer.materials.incidence_per_sqm || 1;
            materialCost += unitPrice * incidence;
            
            // Installation time from material
            const installTime = layer.materials.installation_time_per_sqm || 0;
            totalInstallTime += installTime;
            
            // Add screw cost if present
            if (layer.screw_cost_per_sqm) {
              screwCost += layer.screw_cost_per_sqm;
            }
            
            // Add screw installation time (0.03 minutes per screw)
            if (layer.screw_quantity && layer.screw_quantity > 0) {
              totalInstallTime += layer.screw_quantity * 0.03;
            }
            
            console.log(`[useUpdateGeneralStratigraphyPrices] 💰 Layer ${layer.materials.name}: unitPrice=${unitPrice}, incidence=${incidence}, materialCost=${unitPrice * incidence}`);
          }
        });
      }
      
      // 🔥 CALCOLA MANODOPERA CON COSTO ORARIO DAL DATABASE (IDENTICO A useIntegratedStratigraphySave)
      const laborCost = (totalInstallTime * costPerHour) / 60;
      
      // Calculate total comprehensive cost with HIGH PRECISION to match UI exactly
      const comprehensiveCost = materialCost + screwCost + laborCost;
      
      const newCostPerSqm = Math.round(comprehensiveCost * 100) / 100; // Final 2 decimal precision

      console.log('[useUpdateGeneralStratigraphyPrices] 🧮 COMPREHENSIVE COST BREAKDOWN (SAME AS SAVE):', {
        materialCost: Math.round(materialCost * 1000) / 1000,
        screwCost: Math.round(screwCost * 1000) / 1000,
        laborCost: Math.round(laborCost * 1000) / 1000,
        comprehensive: newCostPerSqm
      });

      console.log('[useUpdateGeneralStratigraphyPrices] 💲 New comprehensive cost per sqm:', newCostPerSqm);

      // Update the general stratigraphy with new comprehensive cost
      const { data: result, error: updateError } = await supabase
        .from('stratigraphies')
        .update({
          // 🔥 UPDATE ALL COST FIELDS like the save function does
          material_cost_per_sqm: Math.round(materialCost * 1000) / 1000,
          screw_cost_per_sqm: Math.round(screwCost * 1000) / 1000,
          labor_cost_per_sqm: Math.round(laborCost * 1000) / 1000,
          comprehensive_cost_per_sqm: newCostPerSqm,
          installation_time_per_sqm: Math.round(totalInstallTime * 1000) / 1000,
          cost_per_sqm: newCostPerSqm, // Legacy field for compatibility
          updated_at: new Date().toISOString()
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
