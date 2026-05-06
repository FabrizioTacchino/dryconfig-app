
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

interface BulkUpdateParams {
  estimateStratigraphies: EstimateStratigraphy[];
}

export const useBulkUpdateEstimateStratigraphyPrices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ estimateStratigraphies }: BulkUpdateParams) => {
      if (!user) throw new Error('User not authenticated');

      if (estimateStratigraphies.length === 0) {
        throw new Error('Nessuna stratigrafia da aggiornare');
      }

      // PROTEZIONE: Verifica lo stato del preventivo prima di procedere
      const estimateId = estimateStratigraphies[0].estimateId;
      
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('status, project_id')
        .eq('id', estimateId)
        .single();

      if (estimateError) {
        console.error('Error fetching estimate for validation:', estimateError);
        throw new Error('Preventivo non trovato');
      }

      // Blocca se il preventivo è contrattualizzato
      if (estimateData.status === 'contracted') {
        throw new Error('Impossibile aggiornare prezzi: preventivo contrattualizzato');
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

      const results = [];

      for (const estStrat of estimateStratigraphies) {
        console.log(`[BulkUpdate] Processing stratigraphy:`, {
          id: estStrat.id,
          name: estStrat.name,
          originalStratigraphyId: estStrat.originalStratigraphyId,
          isSnapshot: estStrat.isSnapshot
        });
        
        if (!estStrat.originalStratigraphyId) {
          console.log(`Skipping ${estStrat.id} - no original stratigraphy ID`);
          continue;
        }

        try {
          console.log(`[BulkUpdate] 🔍 Fetching stratigraphy data for ${estStrat.name} (ID: ${estStrat.originalStratigraphyId})`);
          
          // 🔥 STEP 1: Fetch current hourly labor cost from settings
          const { data: settingData, error: settingError } = await supabase
            .from('configurator_settings')
            .select('value')
            .eq('key', 'cost_per_hour')
            .single();

          if (settingError) {
            console.error(`[BulkUpdate] ❌ Error fetching current labor cost:`, settingError);
            throw new Error('Errore nel recupero del costo orario corrente');
          }

          const currentLaborCostPerHour = parseFloat(settingData?.value || '30');
          console.log(`[BulkUpdate] 💰 Current labor cost per hour: €${currentLaborCostPerHour}`);
          
          // 🔥 STEP 2: Fetch stratigraphy data with materials for dynamic calculation
          const { data: updatedStratigraphy, error: stratigraphyError } = await supabase
            .from('stratigraphies')
            .select(`
              *,
              layers (
                id,
                position,
                thickness,
                inter_axis,
                material_id,
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
                  weight_per_sqm,
                  thermal_conductivity,
                  acoustic_performance,
                  fire_resistance_class,
                  installation_time_per_sqm
                ),
                screw_materials:materials!layers_screw_material_id_fkey (
                  id,
                  name,
                  unit_price,
                  code,
                  supplier,
                  unit
                )
              )
            `)
            .eq('id', estStrat.originalStratigraphyId)
            .single();

          if (stratigraphyError) {
            console.error(`Error fetching stratigraphy ${estStrat.originalStratigraphyId}:`, stratigraphyError);
            continue;
          }

          let newUnitCost = 0;
          let materialCost = 0;
          let screwCost = 0;
          let laborCost = 0;
          let totalInstallTime = 0;
          
          if (updatedStratigraphy.layers && updatedStratigraphy.layers.length > 0) {
            // 🚀 DYNAMIC CALCULATION: Use current hourly labor cost instead of pre-calculated values
            console.log(`🚀 [BulkUpdate] DYNAMIC CALCULATION with current labor cost €${currentLaborCostPerHour}/hour for ${estStrat.name}`);
            
            // Material costs (keep existing logic)
            materialCost = updatedStratigraphy.layers.reduce((total: number, layer: any) => {
              if (layer.materials && layer.thickness > 0) {
                const unitPrice = layer.materials.unit_price || 0;
                const incidence = layer.materials.incidence_per_sqm || 1;
                return total + (unitPrice * incidence);
              }
              return total;
            }, 0);
            
            // Screw costs (keep existing logic)
            screwCost = updatedStratigraphy.layers.reduce((total: number, layer: any) => {
              return total + (layer.screw_cost_per_sqm || 0);
            }, 0);
            
            // 🔥 LABOR COST: Calculate dynamically with current hourly rate
            updatedStratigraphy.layers.forEach((layer: any) => {
              if (layer.materials && layer.thickness > 0) {
                // Base installation time from material
                const baseInstallTime = layer.materials.installation_time_per_sqm || 0;
                
                // Add screw installation time (0.03 minutes per screw)
                const screwInstallTime = layer.screw_quantity > 0 ? layer.screw_quantity * 0.03 : 0;
                
                const layerTotalInstallTime = baseInstallTime + screwInstallTime;
                totalInstallTime += layerTotalInstallTime;
                
                // Calculate labor cost with current hourly rate: (install_time_minutes * hourly_rate) / 60
                const layerLaborCost = (layerTotalInstallTime * currentLaborCostPerHour) / 60;
                laborCost += layerLaborCost;
                
                console.log(`[BulkUpdate] Layer ${layer.materials.name}: installTime=${layerTotalInstallTime}min, laborCost=${layerLaborCost.toFixed(3)}€`);
              }
            });
            
            // Total comprehensive cost with current labor rates
            newUnitCost = Math.round((materialCost + screwCost + laborCost) * 100) / 100;
            
            console.log(`💰 [BulkUpdate] DYNAMIC COSTS for ${estStrat.name}:`, {
              materialCost: Math.round(materialCost * 1000) / 1000,
              screwCost: Math.round(screwCost * 1000) / 1000,
              laborCost: Math.round(laborCost * 1000) / 1000,
              totalInstallTime: Math.round(totalInstallTime * 1000) / 1000,
              newUnitCost: newUnitCost,
              layersCount: updatedStratigraphy.layers.length,
              currentHourlyRate: currentLaborCostPerHour,
              source: 'DYNAMIC_CALCULATION'
            });
          } else {
            console.warn(`⚠️ [BulkUpdate] Nessun layer trovato per ${estStrat.name}`);
          }
          
          const priceDifference = Math.abs(estStrat.unitCost - newUnitCost);
          const hasSignificantChange = priceDifference > 0.01;
          
          console.log(`[BulkUpdate] 💰 ANALISI PREZZI per "${estStrat.name}":`, {
            id: estStrat.id,
            originalId: estStrat.originalStratigraphyId,
            oldCost: estStrat.unitCost,
            newCost: newUnitCost,
            priceDifference: priceDifference,
            hasSignificantChange: hasSignificantChange,
            comprehensive_cost_per_sqm: updatedStratigraphy.comprehensive_cost_per_sqm,
            usedLayersData: true
          });
          
          const newTotalCost = Math.round((estStrat.area * newUnitCost) * 100) / 100;

          // 🔥 FIX: Update stratigraphy_data with new cost breakdown for totals calculation
          const updatedStratigraphyData = {
            ...updatedStratigraphy,
            material_cost_per_sqm: Math.round(materialCost * 1000) / 1000,
            screw_cost_per_sqm: Math.round(screwCost * 1000) / 1000,
            labor_cost_per_sqm: Math.round(laborCost * 1000) / 1000,
            comprehensive_cost_per_sqm: newUnitCost,
            installation_time_per_sqm: Math.round(totalInstallTime * 1000) / 1000,
            cost_per_sqm: newUnitCost
          };

          // Update the estimate stratigraphy
          const { error: updateError } = await supabase
            .from('estimate_stratigraphies')
            .update({
              unit_cost: newUnitCost,
              total_cost: newTotalCost,
              stratigraphy_data: updatedStratigraphyData,
              layers_data: updatedStratigraphy.layers?.sort((a: any, b: any) => a.position - b.position) || [],
              prices_updated_at: new Date().toISOString()
            })
            .eq('id', estStrat.id);

          if (updateError) {
            console.error(`Error updating estimate stratigraphy ${estStrat.id}:`, updateError);
            continue;
          }

          results.push({
            id: estStrat.id,
            name: estStrat.name,
            oldCost: estStrat.unitCost,
            newCost: newUnitCost,
            updated: true
          });
        } catch (error) {
          console.error(`Error processing stratigraphy ${estStrat.id}:`, error);
          results.push({
            id: estStrat.id,
            name: estStrat.name,
            updated: false,
            error: error.message
          });
        }
      }

      return { results, estimateId };
    },
    onSuccess: ({ results, estimateId }) => {
      const updatedCount = results.filter(r => r.updated).length;
      
      console.log(`[BulkUpdate] ✅ ${updatedCount} stratigrafie aggiornate usando calcolo dinamico con costo orario corrente`);
      
      // 🔥 FIX: Invalidazione specifica per l'estimate corrente per aggiornare la tabella
      queryClient.invalidateQueries({ queryKey: ['estimate-stratigraphies', estimateId] });
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
      
      if (updatedCount > 0) {
        // Controlla se ci sono stati cambiamenti reali nei prezzi
        const realChanges = results.filter(r => r.updated && Math.abs(r.oldCost - r.newCost) > 0.01);
        if (realChanges.length > 0) {
          toast.success(`${realChanges.length} stratigrafie aggiornate con prezzi modificati!`);
        } else {
          toast.info(`${updatedCount} stratigrafie controllate - prezzi già aggiornati`);
        }
      } else {
        toast.warning('Nessuna stratigrafia è stata aggiornata');
      }
    },
    onError: (error) => {
      console.error('Error in bulk update:', error);
      if (error.message.includes('contrattualizzato')) {
        toast.error('Impossibile aggiornare prezzi: preventivo contrattualizzato');
      } else {
        toast.error('Errore nell\'aggiornamento dei prezzi');
      }
    },
  });

  return {
    bulkUpdatePrices: bulkUpdateMutation.mutate,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
};
