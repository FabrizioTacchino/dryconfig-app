
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStratigraphy = (id?: string) => {
  return useQuery({
    queryKey: ['stratigraphy', id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log(`[useStratigraphy] 📊 FETCHING stratigraphy: ${id}`);
      
      const { data: stratigraphy, error: stratigraphyError } = await supabase
        .from('stratigraphies')
        .select('*')
        .eq('id', id)
        .single();

      if (stratigraphyError) {
        console.error(`[useStratigraphy] ❌ ERROR fetching stratigraphy:`, stratigraphyError);
        throw stratigraphyError;
      }

      console.log(`[useStratigraphy] 📋 STRATIGRAPHY DATA:`, {
        id: stratigraphy.id,
        name: stratigraphy.name,
        is_certified: stratigraphy.is_certified,
        certification_id: stratigraphy.certification_id,
        allFields: Object.keys(stratigraphy)
      });

      // Fetch layers with materials using the new integrated system
      const { data: layers, error: layersError } = await supabase
        .from('layers')
        .select(`
          *,
          materials!layers_material_id_fkey (*),
          screw_materials:materials!layers_screw_material_id_fkey (*)
        `)
        .eq('stratigraphy_id', id)
        .order('position');

      if (layersError) {
        console.error(`[useStratigraphy] ❌ ERROR fetching layers:`, layersError);
        throw layersError;
      }

      // 🔥 F19.3 — Override unit_price con il valore NETTO dalla view
      // materials_with_pricing. Il join via FK sopra carica `materials` raw,
      // dove unit_price = list_price perché il trigger di recompute filtra
      // per organization_id (e i materiali catalogo globale hanno org=NULL,
      // quindi non vengono mai ricomputati). La view invece applica gli
      // sconti famiglia + extra correttamente per l'org corrente (via RLS).
      const matIds: string[] = [];
      for (const l of layers ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ml = l as any;
        if (ml.materials?.id) matIds.push(ml.materials.id);
        if (ml.screw_materials?.id) matIds.push(ml.screw_materials.id);
      }
      const uniqueMatIds = Array.from(new Set(matIds));
      const priceMap = new Map<string, number>();
      if (uniqueMatIds.length > 0) {
        const { data: pricing, error: pricingError } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('materials_with_pricing' as any)
          .select('id, unit_price')
          .in('id', uniqueMatIds);
        if (pricingError) {
          console.warn(`[useStratigraphy] ⚠️ pricing override failed:`, pricingError);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const p of (pricing ?? []) as any[]) {
            priceMap.set(p.id, Number(p.unit_price ?? 0));
          }
        }
      }
      // Applica gli override
      for (const l of layers ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ml = l as any;
        if (ml.materials?.id && priceMap.has(ml.materials.id)) {
          ml.materials.unit_price = priceMap.get(ml.materials.id);
        }
        if (ml.screw_materials?.id && priceMap.has(ml.screw_materials.id)) {
          ml.screw_materials.unit_price = priceMap.get(ml.screw_materials.id);
        }
      }

      console.log(`[useStratigraphy] ✅ LAYERS LOADED - ${layers?.length || 0} layers found`, {
        layersWithMaterials: layers?.filter(l => l.materials).length || 0,
        layersWithScrews: layers?.filter(l => l.screw_materials).length || 0
      });

      // Process layers with integrated screw data
      const processedLayers = layers?.map(layer => {
        console.log(`[useStratigraphy] 🔧 PROCESSING LAYER:`, {
          id: layer.id,
          material: layer.materials?.name,
          screwMaterial: layer.screw_materials?.name,
          position: layer.position,
          thickness: layer.thickness,
          inter_axis: layer.inter_axis,
          screw_quantity: layer.screw_quantity,
          screw_cost_per_sqm: layer.screw_cost_per_sqm
        });

        return {
          ...layer,
          material: layer.materials,
          screwMaterial: layer.screw_materials,
          // Map database fields to frontend fields
          materialId: layer.material_id,
          screwMaterialId: layer.screw_material_id,
          screwQuantity: layer.screw_quantity,
          screwCostPerSqm: layer.screw_cost_per_sqm,
          calculatedCostPerSqm: 0, // Will be calculated later
          interAxis: layer.inter_axis
        };
      }) || [];

      // 🔥 CRITICAL: If it's a certified stratigraphy, fetch ALL certification data
      let certification = null;
      let materials = [];
      
      if (stratigraphy.is_certified && stratigraphy.certification_id) {
        console.log(`[useStratigraphy] 🏆 LOADING CERTIFIED STRATIGRAPHY DATA for ID: ${stratigraphy.certification_id}`);
        
        // Fetch certification details
        const { data: certData, error: certError } = await supabase
          .from('certifications')
          .select('*')
          .eq('id', stratigraphy.certification_id)
          .single();

        if (certError) {
          console.error(`[useStratigraphy] ❌ ERROR fetching certification:`, certError);
        } else {
          certification = certData;
          console.log(`[useStratigraphy] ✅ CERTIFICATION DATA:`, {
            id: certification.id,
            name: certification.name,
            value: certification.value,
            solution_number: certification.solution_number,
            acoustic_reduction: certification.acoustic_reduction,
            supplier_name: certification.supplier_name,
            allCertFields: Object.keys(certification)
          });
        }

        // Fetch certified materials
        const { data: certMaterials, error: materialsError } = await supabase
          .from('certified_stratigraphy_materials')
          .select('*')
          .eq('certification_id', stratigraphy.certification_id)
          .order('position_order');

        if (materialsError) {
          console.error(`[useStratigraphy] ❌ ERROR fetching certified materials:`, materialsError);
        } else {
          materials = certMaterials || [];
          console.log(`[useStratigraphy] ✅ CERTIFIED MATERIALS:`, {
            count: materials.length,
            materials: materials.map(m => ({ 
              id: m.id, 
              description: m.material_description, 
              position: m.position_type,
              code: m.material_code
            }))
          });
        }
      }

      const result = {
        ...stratigraphy,
        layers: processedLayers,
        layersData: processedLayers, // Compatibility alias
        // 🔥 CRITICAL: Add certification data for certified stratigraphies
        certification,
        materials
      };

      console.log(`[useStratigraphy] 🎯 FINAL COMPREHENSIVE RESULT:`, {
        id: result.id,
        name: result.name,
        totalLayers: result.layers?.length || 0,
        layersWithScrews: result.layers?.filter(l => l.screwMaterialId).length || 0,
        isCertified: result.is_certified,
        hasCertificationData: !!result.certification,
        certifiedMaterialsCount: result.materials?.length || 0,
        certificationValue: result.certification?.value,
        certificationSolutionNumber: result.certification?.solution_number,
        allDataLoaded: !!(result.layers?.length && (result.is_certified ? result.certification : true))
      });

      return result;
    },
    enabled: !!id,
  });
};
