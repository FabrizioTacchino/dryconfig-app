
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WallType, DatabaseWallType } from '@/types';
import { toast } from 'sonner';
import { Layer } from '../components/configurator/types/StratigraphyTypes';
import { computeStratigraphyCosts } from '@/components/configurator-v2/hooks/computeStratigraphyCosts';
import type { LayerV2 } from '@/components/configurator-v2/types';

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
  /** Interasse montanti in mm (400 o 600). Default 600. */
  studSpacingMm?: number;
  /** Flag stratigrafia certificata (default false). Se true, popola anche i campi sotto. */
  isCertified?: boolean;
  /** Codice del test report / certificato di sistema. */
  certificationCode?: string | null;
  /** Laboratorio o ente certificatore. */
  certificationLab?: string | null;
  /** Data del test (ISO YYYY-MM-DD). */
  certificationDate?: string | null;
  /** Note tecniche o link al fascicolo originale. */
  certificationNotes?: string | null;
  /** Rw misurato dB (sostituisce calcolato). */
  acousticPerformance?: number | null;
  /** Correttore C (rumore rosa). */
  acousticRwC?: number | null;
  /** Correttore Ctr (traffico). */
  acousticRwCtr?: number | null;
  /** Norma test acustica (es. "UNI EN ISO 10140-2"). */
  acousticTestNorm?: string | null;
  /** EI/REI misurato (es. "EI 60"). */
  fireResistanceClass?: string | null;
  /** Reazione al fuoco lastre (Euroclasse). */
  fireReactionClass?: string | null;
  /** Norma test resistenza fuoco (es. "EN 1364-1"). */
  fireTestNorm?: string | null;
  /** λ misurato W/mK. */
  thermalPerformance?: number | null;
  /** U globale parete W/m²K. */
  thermalUValue?: number | null;
  /** R globale m²K/W. */
  thermalRValue?: number | null;
  /** Altezza massima parete certificata (m). */
  mechanicalMaxHeightM?: number | null;
  /** Carico ammissibile parete (N/m²). */
  mechanicalLoadNSqm?: number | null;
  /** Carico massimo sospendibile (kg per punto). */
  mechanicalSuspendableLoadKg?: number | null;
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

      // 🔥 F19.2: USA computeStratigraphyCosts — STESSA formula del preview V2.
      // Niente più formula custom inline (sottostimava manodopera ~60×
      // perché leggeva installation_time_per_sqm come minuti invece che ore).
      // Single source of truth: preview, save, reload, bulk update sono
      // tutti allineati.
      const studSpacingMm = data.studSpacingMm ?? 600;
      // Cast Layer (V1) → LayerV2 — strutturalmente compatibili (entrambi
      // hanno materialId, material, thickness, screwMaterial, screwQuantity).
      const layersForCompute = validLayers.map((l, idx) => ({
        id: (l as { id?: string }).id ?? `tmp-${idx}`,
        position: idx + 1,
        materialId: l.materialId,
        material: l.material,
        thickness: l.thickness,
        screwMaterialId: l.screwMaterialId,
        screwMaterial: l.screwMaterial,
        screwQuantity: l.screwQuantity,
        screwCostPerSqm: l.screwCostPerSqm,
        interAxis: l.interAxis,
      })) as unknown as LayerV2[];
      const breakdown = computeStratigraphyCosts(layersForCompute, studSpacingMm, costPerHour);

      // Indicizza i rows per layerIdx per il salvataggio per-layer.
      const rowByLayerIdx = new Map<number, typeof breakdown.rows[number]>();
      breakdown.rows.forEach(r => rowByLayerIdx.set(r.layerIdx, r));
      const screwRowByLayerIdx = new Map<number, typeof breakdown.screwRows[number]>();
      breakdown.screwRows.forEach(r => screwRowByLayerIdx.set(r.layerIdx, r));

      const layersWithCalculatedValues = validLayers.map((layer, index) => {
        const row = rowByLayerIdx.get(index);
        const screwRow = screwRowByLayerIdx.get(index);
        const layerMaterialCost = row?.rowCost ?? 0;
        const layerMinutes = (row?.rowMinutes ?? 0) + (screwRow?.rowMinutes ?? 0);
        const layerLaborCost = (layerMinutes * costPerHour) / 60;
        const layerScrewCost = screwRow?.rowCost ?? Number(layer.screwCostPerSqm ?? 0);

        return {
          ...layer,
          calculatedMaterialCost: layerMaterialCost,
          calculatedInstallTime: layerMinutes,
          calculatedLaborCost: layerLaborCost,
          calculatedScrewCost: layerScrewCost,
        };
      });

      const finalTotals = {
        materialCost: Math.round(breakdown.subtotalMaterials * 1000) / 1000,
        screwCost: Math.round(breakdown.subtotalScrews * 1000) / 1000,
        laborCost: Math.round(breakdown.laborCost * 1000) / 1000,
        installationTime: Math.round(breakdown.laborMinutes * 1000) / 1000,
        comprehensiveCost: Math.round(breakdown.totalCost * 100) / 100,
      };

      console.log('🎯 [SAVE TOTALI] IDENTICI AL PREVIEW CON ARROTONDAMENTO FINALE:', {
        ...finalTotals,
        costPerHour: costPerHour,
        rawTotal: breakdown.totalCost,
        finalRoundedTotal: finalTotals.comprehensiveCost
      });

      const isUpdate = !!data.id;
      const dbWallType = mapWallTypeToDatabase(data.type);

      // 🏗️ STEP 2: SALVA LA STRATIGRAFIA CON I TOTALI IDENTICI AL PREVIEW
      // Per stratigrafie certificate, peso/Rw/EI/λ sono i valori MISURATI dal
      // test, non quelli calcolati a partire dai materiali. Se l'utente ha
      // valorizzato i campi certificazione, li uso al posto dei calcolati.
      const isCertified = !!data.isCertified;
      const certifiedWeight = isCertified && data.weightPerSqm != null
        ? Math.round(Number(data.weightPerSqm) * 100) / 100
        : Math.round(data.weightPerSqm * 100) / 100;

      const stratigraphyData = {
        name: data.name,
        description: data.description,
        type: dbWallType,
        is_certified: isCertified,
        user_id: user.id,
        total_thickness: Math.round(data.totalThickness * 10) / 10,
        weight_per_sqm: certifiedWeight,
        // 💰 SALVA I TOTALI IDENTICI AL PREVIEW
        material_cost_per_sqm: finalTotals.materialCost,
        screw_cost_per_sqm: finalTotals.screwCost,
        labor_cost_per_sqm: finalTotals.laborCost,
        comprehensive_cost_per_sqm: finalTotals.comprehensiveCost,
        installation_time_per_sqm: finalTotals.installationTime,
        cost_per_sqm: finalTotals.comprehensiveCost, // Legacy field per compatibilità
        // F20.3 — Persistere SEMPRE stud_spacing_mm (default 600). Senza questo,
        // il bulk update sul preventivo legge `stud_spacing_mm ?? 600` ma se la
        // stratigrafia fu salvata con un passo diverso e poi il campo è NULL,
        // il recompute usa un passo errato e diverge dal preview.
        stud_spacing_mm: data.studSpacingMm ?? 600,
        // Metadati certificazione (popolati solo se l'utente li valorizza)
        ...(data.certificationCode !== undefined ? { certification_code: data.certificationCode } : {}),
        ...(data.certificationLab !== undefined ? { certification_lab: data.certificationLab } : {}),
        ...(data.certificationDate !== undefined ? { certification_date: data.certificationDate } : {}),
        ...(data.certificationNotes !== undefined ? { certification_notes: data.certificationNotes } : {}),
        ...(data.acousticPerformance !== undefined ? { acoustic_performance: data.acousticPerformance } : {}),
        ...(data.acousticRwC !== undefined ? { acoustic_rw_c_correction: data.acousticRwC } : {}),
        ...(data.acousticRwCtr !== undefined ? { acoustic_rw_ctr_correction: data.acousticRwCtr } : {}),
        ...(data.acousticTestNorm !== undefined ? { acoustic_test_norm: data.acousticTestNorm } : {}),
        ...(data.fireResistanceClass !== undefined ? { fire_resistance_class: data.fireResistanceClass } : {}),
        ...(data.fireReactionClass !== undefined ? { fire_reaction_class: data.fireReactionClass } : {}),
        ...(data.fireTestNorm !== undefined ? { fire_test_norm: data.fireTestNorm } : {}),
        ...(data.thermalPerformance !== undefined ? { thermal_performance: data.thermalPerformance } : {}),
        ...(data.thermalUValue !== undefined ? { thermal_u_value: data.thermalUValue } : {}),
        ...(data.thermalRValue !== undefined ? { thermal_r_value: data.thermalRValue } : {}),
        ...(data.mechanicalMaxHeightM !== undefined ? { mechanical_max_height_m: data.mechanicalMaxHeightM } : {}),
        ...(data.mechanicalLoadNSqm !== undefined ? { mechanical_load_n_sqm: data.mechanicalLoadNSqm } : {}),
        ...(data.mechanicalSuspendableLoadKg !== undefined ? { mechanical_suspendable_load_kg: data.mechanicalSuspendableLoadKg } : {}),
      } as Record<string, unknown>;

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
      const verb = isUpdate ? 'aggiornata' : 'salvata';
      toast.success(`Stratigrafia "${stratigraphy.name}" ${verb}`, {
        description: `€${Number(stratigraphy.comprehensive_cost_per_sqm ?? 0).toFixed(2)}/m² · ${Number(stratigraphy.installation_time_per_sqm ?? 0).toFixed(1)} min/m²`,
      });

      queryClient.invalidateQueries({ queryKey: ['stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['stratigraphy', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['unified-stratigraphies'] });
      // Match certificate: la lista delle certificate dell'org è cached con
      // staleTime 10min — invalida così il banner di match incrocia anche la
      // stratigrafia appena salvata (sia certificata che no, perché potrebbe
      // aver cambiato il flag is_certified su un update).
      queryClient.invalidateQueries({ queryKey: ['certified-stratigraphies'] });
    },
    onError: (error) => {
      console.error('💥 [ERROR]:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante il salvataggio della stratigraphy';
      toast.error(errorMessage);
    },
  });
};
