
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CertifiedStratigraphyFormData } from '@/types/certification';

interface ExtendedCertifiedStratigraphyFormData extends CertifiedStratigraphyFormData {
  layers?: any[];
  totalCost?: number;
  materialCost?: number;
  laborCost?: number;
  screwCost?: number;
  installationTime?: number;
  weightPerSqm?: number;
}

export const useCertifiedStratigraphySave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ExtendedCertifiedStratigraphyFormData) => {
      console.log('[useCertifiedStratigraphySave] 🚀 SAVING CERTIFIED STRATIGRAPHY WITH COMPLETE COSTS');
      console.log('[useCertifiedStratigraphySave] 💰 DETAILED COSTS RECEIVED:', {
        total: data.totalCost,
        material: data.materialCost,
        labor: data.laborCost,
        screw: data.screwCost,
        installTime: data.installationTime,
        weight: data.weightPerSqm
      });

      // Validation: Ensure we have calculated costs
      if (!data.totalCost || data.totalCost === 0) {
        console.error('[useCertifiedStratigraphySave] ❌ NO CALCULATED COSTS PROVIDED');
        throw new Error('Costi non calcolati - assicurati che i layer abbiano materiali validi');
      }

      // Fetch hourly rate from database
      const { data: settingData, error: settingError } = await supabase
        .from('configurator_settings')
        .select('value')
        .eq('key', 'cost_per_hour')
        .single();

      if (settingError) {
        console.error('[useCertifiedStratigraphySave] ❌ Error fetching cost_per_hour:', settingError);
        throw new Error('Errore nel recupero del costo orario');
      }

      const costPerHour = parseFloat(settingData?.value || '30');
      console.log('[useCertifiedStratigraphySave] 💰 HOURLY RATE FROM DB:', costPerHour);

      // ---- STEP 1: Create the certification entry
      const { data: certification, error: certError } = await supabase
        .from('certifications')
        .insert({
          name: data.name,
          code: data.solution_number || `CERT-${Date.now()}`,
          type: data.type === 'single' ? 'Parete Singola' : 
                data.type === 'double' ? 'Parete Doppia' :
                data.type === 'plating' ? 'Rivestimento' :
                data.type === 'counterwall' ? 'Controparete' : 'Soffitto',
          value: data.fire_resistance || 'Non specificato',
          certifier: data.supplier_name || 'Non specificato',
          issue_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          max_height: data.max_height,
          acoustic_reduction: data.acoustic_reduction,
          acoustic_report_code: data.acoustic_report_code,
          extension_code: data.extension_code,
          supplier_name: data.supplier_name,
          solution_code: data.solution_code,
          solution_number: data.solution_number,
          wall_thickness: data.wall_thickness,
          structure_width: data.structure_width,
          fire_test_report_code: data.fire_test_report_code,
          catalog_page: data.catalog_page,
          curvature_radius: data.curvature_radius,
          curvature_radius_description: data.curvature_radius_description,
          break_resistance: data.break_resistance,
          break_resistance_report_code: data.break_resistance_report_code,
          break_resistance_notes: data.break_resistance_notes
        })
        .select()
        .single();

      if (certError) {
        console.error('[useCertifiedStratigraphySave] ❌ ERROR creating certification:', certError);
        throw certError;
      }

      console.log('[useCertifiedStratigraphySave] ✅ CERTIFICATION CREATED - ID:', certification.id);

      // ---- STEP 2: Create the certified stratigraphy WITH ALL CALCULATED COSTS
      console.log('[useCertifiedStratigraphySave] 💰 SAVING STRATIGRAPHY WITH COSTS:', {
        materialCost: data.materialCost,
        screwCost: data.screwCost,
        laborCost: data.laborCost,
        totalCost: data.totalCost,
        installTime: data.installationTime,
        weight: data.weightPerSqm
      });

      const { data: stratigraphy, error: stratError } = await supabase
        .from('stratigraphies')
        .insert({
          name: data.name,
          description: data.description,
          type: data.type,
          total_thickness: data.wall_thickness || 0,
          weight_per_sqm: data.weightPerSqm || 0,
          is_certified: true,
          certification_id: certification.id,
          user_id: null, // Certified stratigraphies don't belong to specific users
          // Save all calculated costs with high precision
          material_cost_per_sqm: Math.round((data.materialCost || 0) * 1000) / 1000,
          screw_cost_per_sqm: Math.round((data.screwCost || 0) * 1000) / 1000,
          labor_cost_per_sqm: Math.round((data.laborCost || 0) * 1000) / 1000,
          comprehensive_cost_per_sqm: Math.round((data.totalCost || 0) * 100) / 100,
          installation_time_per_sqm: Math.round((data.installationTime || 0) * 1000) / 1000,
          cost_per_sqm: Math.round((data.totalCost || 0) * 100) / 100, // Legacy field for compatibility
          fire_resistance_class: data.fire_resistance,
          acoustic_performance: data.acoustic_reduction
        })
        .select()
        .single();

      if (stratError) {
        console.error('[useCertifiedStratigraphySave] ❌ ERROR creating stratigraphy:', stratError);
        throw stratError;
      }

      console.log('[useCertifiedStratigraphySave] ✅ STRATIGRAPHY CREATED WITH ALL COSTS:', {
        id: stratigraphy.id,
        materialCost: stratigraphy.material_cost_per_sqm,
        screwCost: stratigraphy.screw_cost_per_sqm,
        laborCost: stratigraphy.labor_cost_per_sqm,
        comprehensiveCost: stratigraphy.comprehensive_cost_per_sqm,
        installTime: stratigraphy.installation_time_per_sqm,
        legacyCost: stratigraphy.cost_per_sqm
      });

      // ---- STEP 3: Insert certified materials
      if (data.materials && data.materials.length > 0) {
        const materialsToInsert = data.materials.map(material => ({
          ...material,
          certification_id: certification.id
        }));

        const { error: materialsError } = await supabase
          .from('certified_stratigraphy_materials')
          .insert(materialsToInsert);

        if (materialsError) {
          console.error('[useCertifiedStratigraphySave] ❌ ERROR inserting materials:', materialsError);
          throw materialsError;
        }

        console.log('[useCertifiedStratigraphySave] ✅ CERTIFIED MATERIALS INSERTED');
      }

      // ---- STEP 4: Insert layers with individual costs
      if (data.layers && data.layers.length > 0) {
        console.log('[useCertifiedStratigraphySave] 🔧 PREPARING LAYERS with complete individual costs...');
        
        const layersToInsert = await Promise.all(data.layers.map(async (layer: any, index: number) => {
          // Get material data for cost calculations
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('id', layer.materialId)
            .single();

          // Calculate individual layer costs
          let materialCostPerSqm = 0;
          let installTime = 0;

          if (material) {
            if (material.category === 'structure_frame') {
              const interAxis = layer.interAxis || 600;
              const incidenceBase = material.incidence_base || material.incidence_per_sqm || 1;
              const calculatedIncidence = incidenceBase * (600 / interAxis);
              materialCostPerSqm = calculatedIncidence * (material.unit_price || 0);
              installTime = calculatedIncidence * (material.installation_time_per_sqm || 0);
            } else {
              const incidence = material.incidence_per_sqm || 1;
              materialCostPerSqm = (material.unit_price || 0) * incidence;
              installTime = incidence * (material.installation_time_per_sqm || 0);
            }
          }
          
          // Add screw installation time (0.03 minutes per screw)
          const screwInstallTime = layer.screwQuantity ? layer.screwQuantity * 0.03 : 0;
          const totalInstallTime = installTime + screwInstallTime;
          
          // Calculate labor cost for this layer
          const laborCostPerSqm = (totalInstallTime * costPerHour) / 60;

          const layerData: any = {
            stratigraphy_id: stratigraphy.id,
            material_id: layer.materialId,
            thickness: layer.thickness,
            position: index + 1,
            inter_axis: layer.interAxis,
            // Save individual layer costs with complete calculations
            material_cost_per_sqm: Math.round(materialCostPerSqm * 1000) / 1000,
            installation_time_minutes: Math.round(totalInstallTime * 1000) / 1000,
            labor_cost_per_hour: costPerHour,
            labor_cost_per_sqm: Math.round(laborCostPerSqm * 1000) / 1000,
          };

          // INTEGRATED SCREW DATA
          if (layer.screwMaterialId) {
            layerData.screw_material_id = layer.screwMaterialId;
          }

          if (layer.screwQuantity !== undefined && layer.screwQuantity !== null) {
            layerData.screw_quantity = layer.screwQuantity;
          }

          if (layer.screwCostPerSqm !== undefined && layer.screwCostPerSqm !== null) {
            layerData.screw_cost_per_sqm = layer.screwCostPerSqm;
          }

          console.log(`[useCertifiedStratigraphySave] Layer ${index + 1} complete data:`, {
            material: material?.name,
            materialCost: materialCostPerSqm,
            installTime: totalInstallTime,
            laborCost: laborCostPerSqm,
            screwCost: layer.screwCostPerSqm || 0
          });

          return layerData;
        }));

        // EXECUTE THE INSERT
        const { error: layersError } = await supabase
          .from('layers')
          .insert(layersToInsert);

        if (layersError) {
          console.error('[useCertifiedStratigraphySave] ❌ ERROR inserting layers:', layersError);
          throw layersError;
        }

        console.log('[useCertifiedStratigraphySave] ✅ ALL LAYERS INSERTED WITH COMPLETE INDIVIDUAL COSTS');
      }

      console.log('[useCertifiedStratigraphySave] 🎉 CERTIFIED STRATIGRAPHY CREATION COMPLETED WITH CORRECT COSTS');
      return { certification, stratigraphy };
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['unified-stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      
      // Show success message with complete cost details - but don't redirect
      toast.success('Stratigrafia Certificata Salvata!', {
        description: `La stratigrafia "${result.stratigraphy.name}" è stata salvata con successo con tutti i costi calcolati.`,
        duration: 4000,
      });
    },
    onError: (error) => {
      console.error('[useCertifiedStratigraphySave] ❌ SAVE ERROR:', error);
      toast.error('Errore nel salvataggio', {
        description: 'Si è verificato un errore durante il salvataggio della stratigrafia certificata.',
      });
    },
  });
};
