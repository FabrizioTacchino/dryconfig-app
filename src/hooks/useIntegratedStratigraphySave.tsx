
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useIntegratedStratigraphySave = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (saveData: any) => {
      if (!user) throw new Error('User not authenticated');

      console.log('[useIntegratedStratigraphySave] 💾 SALVATAGGIO - DATI IN INGRESSO:', {
        name: saveData.name,
        layersCount: saveData.layers?.length || 0,
        totalThickness: saveData.totalThickness,
        estimatedCost: saveData.estimatedCost,
        previewCosts: saveData.previewCosts,
        isUpdate: !!saveData.id
      });

      // 🔥 USA I VALORI DAL PREVIEW SE DISPONIBILI
      let finalCosts;
      if (saveData.previewCosts) {
        console.log('[useIntegratedStratigraphySave] 🎯 USANDO VALORI DAL PREVIEW:', saveData.previewCosts);
        finalCosts = {
          materialCost: saveData.previewCosts.materialCost,
          laborCost: saveData.previewCosts.laborCost,
          screwCost: saveData.previewCosts.screwCost,
          totalInstallTime: saveData.previewCosts.totalInstallTime,
          comprehensiveCost: saveData.previewCosts.total
        };
      } else {
        // Fallback: calcola i costi come prima
        console.log('[useIntegratedStratigraphySave] ⚠️ FALLBACK: Calcolo costi da layers');
        
        // 🔥 LEGGI IL COSTO ORARIO DAL DATABASE
        const { data: settingData, error: settingError } = await supabase
          .from('configurator_settings')
          .select('value')
          .eq('key', 'cost_per_hour')
          .single();

        if (settingError) {
          console.error('[useIntegratedStratigraphySave] ❌ Error fetching cost_per_hour:', settingError);
          throw new Error('Errore nel recupero del costo orario');
        }

        const costPerHour = parseFloat(settingData?.value || '30');
        console.log('[useIntegratedStratigraphySave] 💰 COSTO ORARIO DAL DB:', costPerHour);

        // Calcola i costi come prima
        let materialCost = 0;
        let screwCost = 0;
        let totalInstallTime = 0;

        saveData.layers.forEach((layer: any, index: number) => {
          if (layer.material) {
            // Calcolo costo materiale
            let layerMaterialCost = 0;
            if (layer.material.category === 'structure_frame') {
              const interAxis = layer.interAxis || 600;
              const incidenceBase = layer.material.incidence_base || layer.material.incidence_per_sqm || 1;
              const calculatedIncidence = incidenceBase * (600 / interAxis);
              layerMaterialCost = calculatedIncidence * layer.material.unit_price;
            } else {
              const incidence = layer.material.incidence_per_sqm || 1;
              layerMaterialCost = incidence * layer.material.unit_price;
            }
            
            materialCost += layerMaterialCost;
            
            // Calcolo tempo installazione completo
            const baseInstallTime = layer.material.installation_time_per_sqm || 0;
            let layerInstallTime = baseInstallTime;
            
            if (layer.screwQuantity && layer.screwQuantity > 0) {
              const screwTime = layer.screwQuantity * 0.03;
              layerInstallTime += screwTime;
            }
            
            totalInstallTime += layerInstallTime;
            
            if (layer.screwCostPerSqm) {
              screwCost += layer.screwCostPerSqm;
            }
          }
        });

        const laborCost = (totalInstallTime * costPerHour) / 60;
        
        const roundedMaterialCost = Math.round(materialCost * 100) / 100;
        const roundedScrewCost = Math.round(screwCost * 100) / 100;
        const roundedLaborCost = Math.round(laborCost * 100) / 100;
        
        const comprehensiveCost = roundedMaterialCost + roundedScrewCost + roundedLaborCost;
        
        finalCosts = {
          materialCost: roundedMaterialCost,
          laborCost: roundedLaborCost,
          screwCost: roundedScrewCost,
          totalInstallTime: Math.round(totalInstallTime * 100) / 100,
          comprehensiveCost: Math.round(comprehensiveCost * 100) / 100
        };
      }

      console.log('[useIntegratedStratigraphySave] 💰 COSTI FINALI DA SALVARE:', finalCosts);

      const stratigraphyData = {
        name: saveData.name,
        description: saveData.description || '',
        type: saveData.type || 'custom',
        total_thickness: saveData.totalThickness,
        weight_per_sqm: saveData.weightPerSqm || 0,
        // 🔥 SALVA I COSTI DAL PREVIEW
        cost_per_sqm: finalCosts.comprehensiveCost,
        comprehensive_cost_per_sqm: finalCosts.comprehensiveCost,
        material_cost_per_sqm: finalCosts.materialCost,
        screw_cost_per_sqm: finalCosts.screwCost,
        labor_cost_per_sqm: finalCosts.laborCost,
        accessories_cost_per_sqm: 0,
        installation_time_per_sqm: finalCosts.totalInstallTime, // 🔥 SALVA IL TEMPO CORRETTO
        user_id: user.id,
        is_certified: false
      };

      console.log('[useIntegratedStratigraphySave] 📝 STRATIGRAPHY DATA TO SAVE:', stratigraphyData);

      let stratigraphyId: string;

      if (saveData.id) {
        // Update esistente
        console.log('[useIntegratedStratigraphySave] 🔄 UPDATING existing stratigraphy:', saveData.id);
        
        const { data: updatedStratigraphy, error: updateError } = await supabase
          .from('stratigraphies')
          .update(stratigraphyData)
          .eq('id', saveData.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('[useIntegratedStratigraphySave] ❌ Update error:', updateError);
          throw updateError;
        }

        stratigraphyId = saveData.id;
        
        // Elimina i layer esistenti
        await supabase
          .from('layers')
          .delete()
          .eq('stratigraphy_id', stratigraphyId);
      } else {
        // Nuova stratigrafia
        console.log('[useIntegratedStratigraphySave] ✨ CREATING new stratigraphy');
        
        const { data: newStratigraphy, error: createError } = await supabase
          .from('stratigraphies')
          .insert(stratigraphyData)
          .select()
          .single();

        if (createError) {
          console.error('[useIntegratedStratigraphySave] ❌ Create error:', createError);
          throw createError;
        }

        stratigraphyId = newStratigraphy.id;
      }

      // 🔥 CREA I NUOVI LAYER CON DATI CORRETTI
      const layersData = saveData.layers.map((layer: any, index: number) => {
        // Calcola costi individuali del layer per i layers
        let layerMaterialCost = 0;
        if (layer.material.category === 'structure_frame') {
          const interAxis = layer.interAxis || 600;
          const incidenceBase = layer.material.incidence_base || layer.material.incidence_per_sqm || 1;
          const calculatedIncidence = incidenceBase * (600 / interAxis);
          layerMaterialCost = calculatedIncidence * layer.material.unit_price;
        } else {
          const incidence = layer.material.incidence_per_sqm || 1;
          layerMaterialCost = incidence * layer.material.unit_price;
        }

        // Calcola tempo installazione completo per il layer
        const baseInstallTime = layer.material?.installation_time_per_sqm || 0;
        const screwInstallTime = layer.screwQuantity ? layer.screwQuantity * 0.03 : 0;
        const totalLayerInstallTime = baseInstallTime + screwInstallTime;
        
        // Calcola labor cost per questo layer (usando 30€/h)
        const layerLaborCost = (totalLayerInstallTime * 30) / 60;

        return {
          stratigraphy_id: stratigraphyId,
          material_id: layer.materialId,
          thickness: layer.material?.thickness || layer.thickness || 0,
          position: index + 1,
          inter_axis: layer.interAxis,
          screw_material_id: layer.screwMaterialId,
          screw_quantity: layer.screwQuantity,
          screw_cost_per_sqm: layer.screwCostPerSqm || 0,
          // Salva i costi individuali del layer
          material_cost_per_sqm: Math.round(layerMaterialCost * 1000) / 1000,
          installation_time_minutes: Math.round(totalLayerInstallTime * 1000) / 1000,
          labor_cost_per_hour: 30,
          labor_cost_per_sqm: Math.round(layerLaborCost * 1000) / 1000,
        };
      });

      console.log('[useIntegratedStratigraphySave] 📝 CREATING LAYERS:', layersData.length);
      
      const { error: layersError } = await supabase
        .from('layers')
        .insert(layersData);

      if (layersError) {
        console.error('[useIntegratedStratigraphySave] ❌ Layers error:', layersError);
        throw layersError;
      }

      console.log('[useIntegratedStratigraphySave] ✅ SALVATAGGIO COMPLETATO - TEMPO E COSTI CORRETTI SALVATI:', {
        installationTime: finalCosts.totalInstallTime,
        laborCost: finalCosts.laborCost,
        totalCost: finalCosts.comprehensiveCost
      });
      
      return { stratigraphyId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['stratigraphy-layers'] });
      toast.success('Stratigrafia salvata con i valori corretti del preview!');
    },
    onError: (error) => {
      console.error('[useIntegratedStratigraphySave] ❌ SAVE ERROR:', error);
      toast.error('Errore nel salvataggio della stratigrafia');
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
  };
};
