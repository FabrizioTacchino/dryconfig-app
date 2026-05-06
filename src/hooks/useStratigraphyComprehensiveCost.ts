
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LayerData {
  id: string;
  position: number;
  thickness: number;
  inter_axis?: number;
  screwMaterialId?: string;
  screwQuantity?: number;
  screwCostPerSqm?: number;
  materials?: {
    id: string;
    name: string;
    category: string;
    unit_price: number;
    incidence_per_sqm?: number;
    incidence_base?: number;
    installation_time_per_sqm?: number;
  };
}

interface UseStratigraphyComprehensiveCostParams {
  layers: LayerData[];
  enabled?: boolean;
  finishLevel?: string;
}

export const useStratigraphyComprehensiveCost = ({
  layers,
  enabled = true,
  finishLevel = 'Q1'
}: UseStratigraphyComprehensiveCostParams) => {
  return useQuery({
    queryKey: ['stratigraphy-comprehensive-cost', layers, finishLevel],
    queryFn: async () => {
      console.log('🔥 [useStratigraphyComprehensiveCost] CALCOLO CON LOGICA ARROTONDAMENTO CORRETTA:', {
        layersCount: layers.length,
        finishLevel
      });

      // 🔥 LEGGI IL COSTO ORARIO DAL DATABASE (IDENTICO AL SAVE)
      const { data: settingData, error: settingError } = await supabase
        .from('configurator_settings')
        .select('value')
        .eq('key', 'cost_per_hour')
        .single();

      if (settingError) {
        console.error('[useStratigraphyComprehensiveCost] ❌ Error fetching cost_per_hour:', settingError);
        throw new Error('Errore nel recupero del costo orario');
      }

      const costPerHour = parseFloat(settingData?.value || '30');
      console.log('[useStratigraphyComprehensiveCost] 💰 COSTO ORARIO DAL DB:', costPerHour);

      // 🔥 STEP 1: CALCOLA I VALORI INDIVIDUALI PER OGNI LAYER (IDENTICO AL SAVE)
      let totalMaterialCost = 0;
      let totalScrewCost = 0;
      let totalInstallTime = 0;
      let totalLaborCost = 0;

      layers.forEach((layer, index) => {
        if (!layer.materials) return;

        // 📊 CALCOLO COSTO MATERIALE PER QUESTO LAYER (IDENTICO AL SAVE)
        let layerMaterialCost = 0;
        const unitPrice = layer.materials.unit_price || 0;

        if (layer.materials.category === 'structure_frame') {
          const interAxis = layer.inter_axis || 600;
          const incidenceBase = layer.materials.incidence_base || layer.materials.incidence_per_sqm || 1;
          const calculatedIncidence = incidenceBase * (600 / interAxis);
          layerMaterialCost = calculatedIncidence * unitPrice;
        } else {
          const incidence = layer.materials.incidence_per_sqm || 1;
          layerMaterialCost = unitPrice * incidence;
        }

        // ⏱️ CALCOLO TEMPO INSTALLAZIONE PER QUESTO LAYER (IDENTICO AL SAVE)
        let layerInstallTime = 0;
        // Tempo base del materiale
        const baseInstallTime = layer.materials.installation_time_per_sqm || 0;
        
        if (layer.materials.category === 'structure_frame') {
          const interAxis = layer.inter_axis || 600;
          const incidenceBase = layer.materials.incidence_base || layer.materials.incidence_per_sqm || 1;
          const calculatedIncidence = incidenceBase * (600 / interAxis);
          layerInstallTime = calculatedIncidence * baseInstallTime;
        } else {
          const incidence = layer.materials.incidence_per_sqm || 1;
          layerInstallTime = incidence * baseInstallTime;
        }
        
        // Tempo aggiuntivo per le viti (0.03 minuti per vite)
        const screwInstallTime = layer.screwQuantity ? layer.screwQuantity * 0.03 : 0;
        layerInstallTime += screwInstallTime;

        // 💰 CALCOLO COSTO MANODOPERA PER QUESTO LAYER CON COSTO ORARIO DAL DB
        const layerLaborCost = (layerInstallTime * costPerHour) / 60;

        // 🔩 COSTO VITI PER QUESTO LAYER (IDENTICO AL SAVE)
        const layerScrewCost = layer.screwCostPerSqm || 0;

        // ➕ AGGIUNGI AI TOTALI (IDENTICO AL SAVE)
        totalMaterialCost += layerMaterialCost;
        totalScrewCost += layerScrewCost;
        totalInstallTime += layerInstallTime;
        totalLaborCost += layerLaborCost;

        console.log(`📋 [PREVIEW Layer ${index + 1}] ${layer.materials.name}:`, {
          materialCost: layerMaterialCost,
          installTime: layerInstallTime,
          laborCost: layerLaborCost,
          screwCost: layerScrewCost,
          costPerHour: costPerHour
        });
      });

      // 🎯 TOTALI FINALI CON ARROTONDAMENTO IDENTICO AL SAVE
      // 🔥 CORREZIONE CRITICA: Arrotonda SOLO il totale finale, non i componenti
      const finalTotals = {
        materialCost: Math.round(totalMaterialCost * 1000) / 1000,
        screwCost: Math.round(totalScrewCost * 1000) / 1000,
        laborCost: Math.round(totalLaborCost * 1000) / 1000,
        accessoriesCost: Math.round(totalScrewCost * 1000) / 1000, // 🔧 AGGIUNTO accessoriesCost per compatibilità
        totalInstallTimeMinutes: Math.round(totalInstallTime * 1000) / 1000,
        // 🎯 ARROTONDAMENTO FINALE CORRETTO: arrotondamento normale per 5.19
        total: +(totalMaterialCost + totalScrewCost + totalLaborCost).toFixed(2)
      };

      console.log('🎯 [PREVIEW TOTALI] CORRETTI CON ARROTONDAMENTO FINALE:', {
        ...finalTotals,
        costPerHour: costPerHour,
        rawTotal: totalMaterialCost + totalScrewCost + totalLaborCost,
        finalRoundedTotal: finalTotals.total,
        expectedTotal: '5.19' // Totale atteso nel preview
      });

      return finalTotals;
    },
    enabled: enabled && layers.length > 0,
    staleTime: 30000, // 30 seconds
  });
};
