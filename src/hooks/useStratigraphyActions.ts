import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WallType, DatabaseWallType } from '@/types';

// Helper function to convert WallType to DatabaseWallType
const mapWallTypeToDatabase = (wallType: WallType | string): DatabaseWallType => {
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

// 🔥 FUNZIONE AGGIORNATA: Calcola tutti i costi usando SOLO i valori reali dai layers con tempo completo
const calculateComprehensiveCosts = async (layersWithMaterials: any[]) => {
  let materialCost = 0;
  let screwCost = 0;
  let totalInstallTime = 0;
  
  // 🔥 LEGGI IL COSTO ORARIO DAL DATABASE
  const { data: settingData } = await supabase
    .from('configurator_settings')
    .select('value')
    .eq('key', 'cost_per_hour')
    .single();
    
  const costPerHour = parseFloat(settingData?.value || '30');
  console.log('[calculateComprehensiveCosts] 💰 COSTO ORARIO DAL DB:', costPerHour);
  
  layersWithMaterials.forEach((layer: any) => {
    if (layer.materials && layer.thickness > 0) {
      // Base material cost (INCLUDING accessory materials now as layers)
      const unitPrice = layer.materials.unit_price || 0;
      const incidence = layer.materials.incidence_per_sqm || 1;
      materialCost += unitPrice * incidence;
      
      // 🔥 CALCOLA TEMPO INSTALLAZIONE COMPLETO (MATERIALE + VITI)
      const baseInstallTime = layer.materials.installation_time_per_sqm || 0;
      const screwInstallTime = layer.screw_quantity ? layer.screw_quantity * 0.03 : 0;
      const layerInstallTime = baseInstallTime + screwInstallTime;
      
      totalInstallTime += layerInstallTime;
      
      // Add screw cost if present (with full precision)
      if (layer.screw_cost_per_sqm) {
        screwCost += layer.screw_cost_per_sqm;
      }
      
      console.log(`[calculateComprehensiveCosts] Layer ${layer.materials.name}:`, {
        baseTime: baseInstallTime,
        screwTime: screwInstallTime,
        totalTime: layerInstallTime,
        screwQuantity: layer.screw_quantity || 0
      });
    }
  });
  
  // 🔥 CALCOLA MANODOPERA CON VALORE DAL DATABASE
  const laborCost = (totalInstallTime * costPerHour) / 60;
  
  // Calculate total comprehensive cost with HIGH PRECISION to match UI exactly
  const comprehensiveCost = materialCost + screwCost + laborCost;
  
  return {
    materialCost: Math.round(materialCost * 1000) / 1000, // 3 decimal precision
    screwCost: Math.round(screwCost * 1000) / 1000, // 3 decimal precision
    laborCost: Math.round(laborCost * 1000) / 1000, // 3 decimal precision
    comprehensiveCost: Math.round(comprehensiveCost * 100) / 100, // Final 2 decimal precision
    installationTime: Math.round(totalInstallTime * 1000) / 1000, // 3 decimal precision
    costPerHour // Return costPerHour for logging
  };
};

interface StratigraphyFormData {
  name: string;
  type: string;
  description?: string;
  total_thickness: number;
  weight_per_sqm: number;
  cost_per_sqm: number;
  // 🎯 CAMPI per costi dettagliati senza accessori separati
  material_cost_per_sqm?: number;
  screw_cost_per_sqm?: number;
  labor_cost_per_sqm?: number;
  comprehensive_cost_per_sqm?: number;
  layers: Array<{
    material_id: string;
    thickness: number;
    position: number;
    inter_axis?: number;
    // INTEGRATED SCREW FIELDS
    screw_material_id?: string;
    screw_quantity?: number;
    screw_cost_per_sqm?: number;
  }>;
}

export const useCreateStratigraphy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StratigraphyFormData) => {
      console.log('[useCreateStratigraphy] 🚀 CREATING STRATIGRAPHY WITH COMPLETE INSTALL TIME');
      console.log('[useCreateStratigraphy] 📦 Data received:', {
        name: data.name,
        layersCount: data.layers.length,
        layersWithScrews: data.layers.filter(l => l.screw_material_id).length
      });

      // Prima dobbiamo calcolare i costi dettagliati
      // Recuperiamo i dati dei materiali per calcolare correttamente
      const layersWithMaterials = await Promise.all(
        data.layers.map(async (layer) => {
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('id', layer.material_id)
            .single();
          
          return {
            ...layer,
            materials: material
          };
        })
      );

      // 🔥 CALCOLA TUTTI I COSTI USANDO LA LOGICA CORRETTA CON TEMPO COMPLETO
      const comprehensiveCosts = await calculateComprehensiveCosts(layersWithMaterials);

      console.log('[useCreateStratigraphy] 💰 COSTI CALCOLATI CON TEMPO COMPLETO:', {
        material: comprehensiveCosts.materialCost,
        screw: comprehensiveCosts.screwCost,
        labor: comprehensiveCosts.laborCost,
        comprehensive: comprehensiveCosts.comprehensiveCost,
        installationTime: comprehensiveCosts.installationTime,
        costPerHour: comprehensiveCosts.costPerHour
      });
      
      // ---- STEP 1: Create main stratigraphy with USER-PROVIDED ACCESSORY COSTS
      const { data: stratigraphy, error } = await supabase
        .from('stratigraphies')
        .insert({
          name: data.name,
          type: mapWallTypeToDatabase(data.type),
          description: data.description,
          total_thickness: data.total_thickness,
          weight_per_sqm: data.weight_per_sqm,
          cost_per_sqm: comprehensiveCosts.comprehensiveCost, // Legacy field
          // 🔥 DETAILED COSTS WITH REAL VALUES FROM LAYERS
          material_cost_per_sqm: comprehensiveCosts.materialCost,
          screw_cost_per_sqm: comprehensiveCosts.screwCost,
          labor_cost_per_sqm: comprehensiveCosts.laborCost,
          comprehensive_cost_per_sqm: comprehensiveCosts.comprehensiveCost,
          installation_time_per_sqm: comprehensiveCosts.installationTime,
        })
        .select()
        .single();

      if (error) {
        console.error('[useCreateStratigraphy] ❌ ERROR creating stratigraphy:', error);
        throw error;
      }

      console.log('[useCreateStratigraphy] ✅ STRATIGRAPHY CREATED WITH COMPLETE INSTALL TIME - ID:', stratigraphy.id);

      // ---- STEP 2: Insert ALL layers with integrated screw data AND complete installation time
      if (data.layers.length > 0) {
        console.log('[useCreateStratigraphy] 🔧 PREPARING LAYERS with complete install time...');
        
        const layersToInsert = await Promise.all(data.layers.map(async (layer, index) => {
          // Get material data for cost calculations
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('id', layer.material_id)
            .single();

          // Calculate individual layer costs
          const materialCostPerSqm = material ? 
            Math.round((material.unit_price || 0) * (material.incidence_per_sqm || 1) * 1000) / 1000 : 0;
          
          // 🔥 CALCOLA TEMPO INSTALLAZIONE COMPLETO (MATERIALE + VITI)
          const baseInstallTime = material?.installation_time_per_sqm || 0;
          const screwInstallTime = layer.screw_quantity ? layer.screw_quantity * 0.03 : 0;
          const totalInstallTime = baseInstallTime + screwInstallTime;
          
          // 🔥 CALCOLA LABOR COST PER QUESTO LAYER CON COSTO ORARIO DAL DB
          const laborCostPerSqm = (totalInstallTime * comprehensiveCosts.costPerHour) / 60;

          const layerData: any = {
            stratigraphy_id: stratigraphy.id,
            material_id: layer.material_id,
            thickness: layer.thickness,
            position: layer.position,
            inter_axis: layer.inter_axis,
            // 🔥 SALVA I COSTI INDIVIDUALI DEL LAYER CON TEMPO COMPLETO
            material_cost_per_sqm: Math.round(materialCostPerSqm * 1000) / 1000,
            installation_time_minutes: Math.round(totalInstallTime * 1000) / 1000,
            labor_cost_per_hour: comprehensiveCosts.costPerHour,
            labor_cost_per_sqm: Math.round(laborCostPerSqm * 1000) / 1000,
          };

          // INTEGRATED SCREW DATA
          if (layer.screw_material_id) {
            layerData.screw_material_id = layer.screw_material_id;
          }

          if (layer.screw_quantity !== undefined && layer.screw_quantity !== null) {
            layerData.screw_quantity = layer.screw_quantity;
          }

          if (layer.screw_cost_per_sqm !== undefined && layer.screw_cost_per_sqm !== null) {
            layerData.screw_cost_per_sqm = layer.screw_cost_per_sqm;
          }

          console.log(`[useCreateStratigraphy] Layer ${index + 1} install time:`, {
            material: material?.name,
            baseTime: baseInstallTime,
            screwTime: screwInstallTime,
            totalTime: totalInstallTime,
            laborCost: laborCostPerSqm
          });

          return layerData;
        }));

        // EXECUTE THE INSERT
        const { error: layersError } = await supabase
          .from('layers')
          .insert(layersToInsert);

        if (layersError) {
          console.error('[useCreateStratigraphy] ❌ ERROR inserting layers:', layersError);
          throw layersError;
        }

        console.log('[useCreateStratigraphy] ✅ ALL LAYERS INSERTED WITH COMPLETE INSTALL TIME');
      }

      console.log('[useCreateStratigraphy] 🎉 CREATION COMPLETED WITH COMPLETE INSTALL TIME - ID:', stratigraphy.id);
      return stratigraphy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['unified-stratigraphies'] });
    },
  });
};

export const useUpdateStratigraphy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: StratigraphyFormData & { id: string }) => {
      console.log('[useUpdateStratigraphy] 🔄 UPDATING STRATIGRAPHY WITH COMPLETE INSTALL TIME - ID:', id);
      
      // Prima dobbiamo calcolare i costi dettagliati
      // Recuperiamo i dati dei materiali per calcolare correttamente
      const layersWithMaterials = await Promise.all(
        data.layers.map(async (layer) => {
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('id', layer.material_id)
            .single();
          
          return {
            ...layer,
            materials: material
          };
        })
      );

      // 🔥 CALCOLA TUTTI I COSTI USANDO LA LOGICA CORRETTA CON TEMPO COMPLETO
      const comprehensiveCosts = await calculateComprehensiveCosts(layersWithMaterials);

      console.log('[useUpdateStratigraphy] 💰 COSTI CALCOLATI CON TEMPO COMPLETO:', {
        material: comprehensiveCosts.materialCost,
        screw: comprehensiveCosts.screwCost,
        labor: comprehensiveCosts.laborCost,
        comprehensive: comprehensiveCosts.comprehensiveCost,
        installationTime: comprehensiveCosts.installationTime,
        costPerHour: comprehensiveCosts.costPerHour
      });
      
      // ---- STEP 1: Update main stratigraphy with CALCULATED COSTS
      const { data: stratigraphy, error } = await supabase
        .from('stratigraphies')
        .update({
          name: data.name,
          type: mapWallTypeToDatabase(data.type),
          description: data.description,
          total_thickness: data.total_thickness,
          weight_per_sqm: data.weight_per_sqm,
          cost_per_sqm: comprehensiveCosts.comprehensiveCost, // Legacy field
          // 🔥 DETAILED COSTS WITH REAL VALUES FROM LAYERS
          material_cost_per_sqm: comprehensiveCosts.materialCost,
          screw_cost_per_sqm: comprehensiveCosts.screwCost,
          labor_cost_per_sqm: comprehensiveCosts.laborCost,
          comprehensive_cost_per_sqm: comprehensiveCosts.comprehensiveCost,
          installation_time_per_sqm: comprehensiveCosts.installationTime,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateStratigraphy] ❌ ERROR updating stratigraphy:', error);
        throw error;
      }

      console.log('[useUpdateStratigraphy] ✅ STRATIGRAPHY UPDATED WITH COMPLETE INSTALL TIME');

      // ---- STEP 2: Delete existing layers
      const { error: deleteError } = await supabase.from('layers').delete().eq('stratigraphy_id', id);
      if (deleteError) {
        console.error('[useUpdateStratigraphy] ❌ ERROR deleting layers:', deleteError);
        throw deleteError;
      }

      // ---- STEP 3: Insert new layers with integrated screw data AND complete installation time
      if (data.layers.length > 0) {        
        const layersToInsert = await Promise.all(data.layers.map(async (layer, index) => {
          // Get material data for cost calculations
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('id', layer.material_id)
            .single();

          // Calculate individual layer costs
          const materialCostPerSqm = material ? 
            Math.round((material.unit_price || 0) * (material.incidence_per_sqm || 1) * 1000) / 1000 : 0;
          
          // 🔥 CALCOLA TEMPO INSTALLAZIONE COMPLETO (MATERIALE + VITI)
          const baseInstallTime = material?.installation_time_per_sqm || 0;
          const screwInstallTime = layer.screw_quantity ? layer.screw_quantity * 0.03 : 0;
          const totalInstallTime = baseInstallTime + screwInstallTime;
          
          // 🔥 CALCOLA LABOR COST PER QUESTO LAYER CON COSTO ORARIO DAL DB
          const laborCostPerSqm = (totalInstallTime * comprehensiveCosts.costPerHour) / 60;

          const layerData: any = {
            stratigraphy_id: id,
            material_id: layer.material_id,
            thickness: layer.thickness,
            position: layer.position,
            inter_axis: layer.inter_axis,
            // 🔥 SALVA I COSTI INDIVIDUALI DEL LAYER CON TEMPO COMPLETO
            material_cost_per_sqm: Math.round(materialCostPerSqm * 1000) / 1000,
            installation_time_minutes: Math.round(totalInstallTime * 1000) / 1000,
            labor_cost_per_hour: comprehensiveCosts.costPerHour,
            labor_cost_per_sqm: Math.round(laborCostPerSqm * 1000) / 1000,
          };

          // INTEGRATED SCREW DATA
          if (layer.screw_material_id) {
            layerData.screw_material_id = layer.screw_material_id;
          }

          if (layer.screw_quantity !== undefined && layer.screw_quantity !== null) {
            layerData.screw_quantity = layer.screw_quantity;
          }

          if (layer.screw_cost_per_sqm !== undefined && layer.screw_cost_per_sqm !== null) {
            layerData.screw_cost_per_sqm = layer.screw_cost_per_sqm;
          }

          return layerData;
        }));

        const { error: layersError } = await supabase
          .from('layers')
          .insert(layersToInsert);

        if (layersError) {
          console.error('[useUpdateStratigraphy] ❌ ERROR inserting new layers:', layersError);
          throw layersError;
        }

        console.log('[useUpdateStratigraphy] ✅ NEW LAYERS INSERTED WITH COMPLETE INSTALL TIME');
      }

      console.log('[useUpdateStratigraphy] 🎉 UPDATE COMPLETED WITH COMPLETE INSTALL TIME - ID:', id);
      return stratigraphy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['unified-stratigraphies'] });
    },
  });
};
