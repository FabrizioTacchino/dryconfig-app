
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WallType, DatabaseWallType } from '@/types';
import { toast } from 'sonner';
import { Layer } from '../components/configurator/types/StratigraphyTypes';

// Helper function to convert WallType to DatabaseWallType
const mapWallTypeToDatabase = (wallType: WallType): DatabaseWallType => {
  if (['plating', 'counterwall', 'single', 'double', 'ceiling'].includes(wallType)) {
    return wallType as DatabaseWallType;
  }
  
  switch (wallType) {
    case 'internal':
    case 'external':
      return 'single';
    case 'roof':
      return 'ceiling';
    case 'foundation':
      return 'single';
    default:
      return 'single';
  }
};

interface SaveStratigraphyData {
  id?: string;
  name: string;
  description: string;
  type: WallType;
  layers: Layer[];
  totalThickness: number;
  estimatedCost: number;
  weightPerSqm: number;
}

export const useIntegratedStratigraphySave = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveStratigraphyData) => {
      if (!user) throw new Error('User not authenticated');

      console.log('🚀 [useIntegratedStratigraphySave] SALVATAGGIO CON LOGICA ARROTONDAMENTO CORRETTA:', {
        name: data.name,
        totalLayers: data.layers.length,
        layersWithScrews: data.layers.filter(l => l.screwMaterialId).length,
        isUpdate: !!data.id
      });

      // Validazione base
      if (!data.name.trim()) {
        throw new Error('Il nome della stratigrafia è obbligatorio');
      }

      // Filtra solo i layer validi (con materiale e spessore > 0)
      const validLayers = data.layers.filter(layer => {
        const hasValidMaterial = !!layer.materialId;
        const hasValidThickness = typeof layer.thickness === 'number' && layer.thickness > 0;
        return hasValidMaterial && hasValidThickness;
      });

      if (validLayers.length === 0) {
        throw new Error('Non è possibile salvare una stratigrafia vuota. Aggiungi almeno un layer con materiale valido.');
      }

      // 🔥 LEGGI IL COSTO ORARIO DAL DATABASE (IDENTICO AL PREVIEW)
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

      // 🔥 STEP 1: CALCOLA I VALORI INDIVIDUALI PER OGNI LAYER (IDENTICO AL PREVIEW)
      let totalMaterialCost = 0;
      let totalScrewCost = 0;
      let totalInstallTime = 0;
      let totalLaborCost = 0;

      const layersWithCalculatedValues = validLayers.map((layer, index) => {
        // 📊 CALCOLO COSTO MATERIALE PER QUESTO LAYER (IDENTICO AL PREVIEW)
        let layerMaterialCost = 0;
        if (layer.material) {
          const unitPrice = layer.material.unit_price || 0;
          const incidence = layer.material.incidence_per_sqm || 1;
          layerMaterialCost = unitPrice * incidence;
        }

        // ⏱️ CALCOLO TEMPO INSTALLAZIONE PER QUESTO LAYER (IDENTICO AL PREVIEW)
        let layerInstallTime = 0;
        if (layer.material) {
          // Tempo base del materiale
          const baseInstallTime = layer.material.installation_time_per_sqm || 0;
          // Tempo aggiuntivo per le viti (0.03 minuti per vite)
          const screwInstallTime = layer.screwQuantity ? layer.screwQuantity * 0.03 : 0;
          layerInstallTime = baseInstallTime + screwInstallTime;
        }

        // 💰 CALCOLO COSTO MANODOPERA PER QUESTO LAYER CON COSTO ORARIO DAL DB
        const layerLaborCost = (layerInstallTime * costPerHour) / 60;

        // 🔩 COSTO VITI PER QUESTO LAYER (IDENTICO AL PREVIEW)
        const layerScrewCost = layer.screwCostPerSqm || 0;

        // ➕ AGGIUNGI AI TOTALI (IDENTICO AL PREVIEW)
        totalMaterialCost += layerMaterialCost;
        totalScrewCost += layerScrewCost;
        totalInstallTime += layerInstallTime;
        totalLaborCost += layerLaborCost;

        console.log(`📋 [SAVE Layer ${index + 1}] ${layer.material?.name}:`, {
          materialCost: layerMaterialCost,
          installTime: layerInstallTime,
          laborCost: layerLaborCost,
          screwCost: layerScrewCost,
          costPerHour: costPerHour
        });

        return {
          ...layer,
          calculatedMaterialCost: layerMaterialCost,
          calculatedInstallTime: layerInstallTime,
          calculatedLaborCost: layerLaborCost,
          calculatedScrewCost: layerScrewCost
        };
      });

      // 🎯 TOTALI FINALI CON ARROTONDAMENTO IDENTICO AL PREVIEW
      // 🔥 CORREZIONE CRITICA: Arrotonda SOLO il totale finale, non i componenti
      const finalTotals = {
        materialCost: Math.round(totalMaterialCost * 1000) / 1000,
        screwCost: Math.round(totalScrewCost * 1000) / 1000,
        laborCost: Math.round(totalLaborCost * 1000) / 1000,
        installationTime: Math.round(totalInstallTime * 1000) / 1000,
        // 🎯 ARROTONDAMENTO FINALE IDENTICO AL PREVIEW: prima somma, poi arrotonda
        comprehensiveCost: Math.round((totalMaterialCost + totalScrewCost + totalLaborCost) * 100) / 100
      };

      console.log('🎯 [SAVE TOTALI] IDENTICI AL PREVIEW CON ARROTONDAMENTO FINALE:', {
        ...finalTotals,
        costPerHour: costPerHour,
        rawTotal: totalMaterialCost + totalScrewCost + totalLaborCost,
        finalRoundedTotal: finalTotals.comprehensiveCost
      });

      const isUpdate = !!data.id;
      const dbWallType = mapWallTypeToDatabase(data.type);

      // 🏗️ STEP 2: SALVA LA STRATIGRAFIA CON I TOTALI IDENTICI AL PREVIEW
      const stratigraphyData = {
        name: data.name,
        description: data.description,
        type: dbWallType,
        is_certified: false,
        user_id: user.id,
        total_thickness: Math.round(data.totalThickness * 10) / 10,
        weight_per_sqm: Math.round(data.weightPerSqm * 100) / 100,
        // 💰 SALVA I TOTALI IDENTICI AL PREVIEW
        material_cost_per_sqm: finalTotals.materialCost,
        screw_cost_per_sqm: finalTotals.screwCost,
        labor_cost_per_sqm: finalTotals.laborCost,
        comprehensive_cost_per_sqm: finalTotals.comprehensiveCost,
        installation_time_per_sqm: finalTotals.installationTime,
        cost_per_sqm: finalTotals.comprehensiveCost, // Legacy field per compatibilità
      };

      let stratigraphy;

      if (isUpdate) {
        console.log('🔄 [UPDATING] stratigraphy con totali identici al preview');
        const { data: updatedStratigraphy, error: stratigraphyError } = await supabase
          .from('stratigraphies')
          .update(stratigraphyData)
          .eq('id', data.id)
          .select()
          .single();

        if (stratigraphyError) {
          console.error('❌ [UPDATE ERROR]:', stratigraphyError);
          throw new Error(`Errore durante l'aggiornamento: ${stratigraphyError.message}`);
        }

        stratigraphy = updatedStratigraphy;

        // Elimina tutti i layer esistenti per ricrearli
        console.log('🗑️ [DELETING] existing layers');
        const { error: deleteLayersError } = await supabase
          .from('layers')
          .delete()
          .eq('stratigraphy_id', data.id);

        if (deleteLayersError) {
          console.error('❌ [DELETE LAYERS ERROR]:', deleteLayersError);
          throw new Error(`Errore durante la rimozione dei layer esistenti: ${deleteLayersError.message}`);
        }
      } else {
        console.log('🆕 [CREATING] new stratigraphy con totali identici al preview');
        const { data: newStratigraphy, error: stratigraphyError } = await supabase
          .from('stratigraphies')
          .insert(stratigraphyData)
          .select()
          .single();

        if (stratigraphyError) {
          console.error('❌ [CREATE ERROR]:', stratigraphyError);
          throw new Error(`Errore durante il salvataggio: ${stratigraphyError.message}`);
        }

        stratigraphy = newStratigraphy;
      }

      console.log('✅ [STRATIGRAPHY SAVED] con totali identici al preview:', {
        id: stratigraphy.id,
        materialCost: stratigraphy.material_cost_per_sqm,
        screwCost: stratigraphy.screw_cost_per_sqm,
        laborCost: stratigraphy.labor_cost_per_sqm,
        installTime: stratigraphy.installation_time_per_sqm,
        comprehensiveCost: stratigraphy.comprehensive_cost_per_sqm,
        costPerHour: costPerHour
      });

      // 🧱 STEP 3: INSERISCI I LAYER CON I VALORI INDIVIDUALI CALCOLATI
      const layersToInsert = layersWithCalculatedValues.map((layer, index) => {
        const layerData = {
          stratigraphy_id: stratigraphy.id,
          material_id: layer.materialId,
          thickness: Math.round(layer.thickness * 10) / 10,
          position: index + 1,
          inter_axis: layer.interAxis && layer.interAxis > 0 ? layer.interAxis : null,
          // 💾 SALVA I VALORI INDIVIDUALI CALCOLATI PER QUESTO LAYER
          material_cost_per_sqm: Math.round(layer.calculatedMaterialCost * 1000) / 1000,
          installation_time_minutes: Math.round(layer.calculatedInstallTime * 1000) / 1000,
          labor_cost_per_hour: costPerHour,
          labor_cost_per_sqm: Math.round(layer.calculatedLaborCost * 1000) / 1000,
          // 🔩 INTEGRATED SCREW DATA
          screw_material_id: layer.screwMaterialId || null,
          screw_quantity: layer.screwQuantity || null,
          screw_cost_per_sqm: layer.screwCostPerSqm || null,
        };

        console.log(`💾 [LAYER ${index + 1}] SALVANDO:`, {
          material_id: layerData.material_id,
          material_cost_per_sqm: layerData.material_cost_per_sqm,
          installation_time_minutes: layerData.installation_time_minutes,
          labor_cost_per_sqm: layerData.labor_cost_per_sqm,
          labor_cost_per_hour: layerData.labor_cost_per_hour,
          screw_cost_per_sqm: layerData.screw_cost_per_sqm
        });

        return layerData;
      });

      console.log('💾 [INSERTING] tutti i layers:', layersToInsert.length);

      const { error: layersError } = await supabase
        .from('layers')
        .insert(layersToInsert);

      if (layersError) {
        console.error('❌ [LAYERS ERROR]:', layersError);
        throw new Error(`Errore durante il salvataggio dei layer: ${layersError.message}`);
      }

      console.log('✅ [ALL LAYERS SAVED]');
      console.log('🎉 [COMPLETATO] PREVIEW E SALVATAGGIO IDENTICI CON ARROTONDAMENTO CORRETTO!');
      console.log('📊 [VERIFICA FINALE - ARROTONDAMENTO CORRETTO]:', {
        stratigrafia_installation_time: stratigraphy.installation_time_per_sqm,
        stratigrafia_labor_cost: stratigraphy.labor_cost_per_sqm,
        stratigrafia_total_cost: stratigraphy.comprehensive_cost_per_sqm,
        layers_count: layersToInsert.length,
        cost_per_hour: costPerHour,
        expectedTotal: '5.24' // Totale atteso
      });

      return stratigraphy;
    },
    onSuccess: (stratigraphy, variables) => {
      const isUpdate = !!variables.id;
      console.log('🎊 [SUCCESS] ARROTONDAMENTO CORRETTO - PREVIEW E SALVATAGGIO IDENTICI!', isUpdate ? 'UPDATE' : 'CREATE');
      toast.success(`Stratigrafia "${stratigraphy.name}" ${isUpdate ? 'aggiornata' : 'salvata'} con successo! 
        📊 Tempo: ${stratigraphy.installation_time_per_sqm} min
        💰 Manodopera: €${stratigraphy.labor_cost_per_sqm}
        🎯 Totale: €${stratigraphy.comprehensive_cost_per_sqm}/m²`);
      
      queryClient.invalidateQueries({ queryKey: ['stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['stratigraphy', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['unified-stratigraphies'] });
    },
    onError: (error) => {
      console.error('💥 [ERROR]:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante il salvataggio della stratigraphy';
      toast.error(errorMessage);
    },
  });
};
