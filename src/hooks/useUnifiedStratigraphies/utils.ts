
import { UnifiedStratigraphy } from './types';

// Helper function to extract supplier name from layers
export const extractSupplierName = (layers: any[] | undefined): string | undefined => {
  if (!layers || layers.length === 0) return undefined;
  
  const suppliers = [...new Set(
    layers
      .map(layer => {
        // Handle both `material` and `materials` properties for backward compatibility
        const material = layer.material || layer.materials;
        return material?.supplier;
      })
      .filter(Boolean)
  )];
  
  console.log('Extracted suppliers from layers:', suppliers);
  
  if (suppliers.length === 0) return undefined;
  if (suppliers.length === 1) return suppliers[0];
  return `Misti (${suppliers.length} fornitori)`;
};

// Helper function to extract material names from layers for searching
export const extractMaterialNames = (layers: any[] | undefined): string => {
  if (!layers || layers.length === 0) return '';
  
  const materialNames = layers
    .map(layer => {
      const material = layer.material || layer.materials;
      return material?.name || '';
    })
    .filter(Boolean)
    .join(' ');
  
  return materialNames.toLowerCase();
};

export const convertRegularStratigraphiesToUnified = (
  stratigraphies: any[],
  editingStratigraphy?: any | null
): UnifiedStratigraphy[] => {
  let stratigraphiesToProcess = stratigraphies;
  
  // If we have an editing stratigraphy, update it in the list or add it if not present
  if (editingStratigraphy && editingStratigraphy.stratigraphy) {
    const editingId = editingStratigraphy.stratigraphyId || editingStratigraphy.id;
    const editingData = editingStratigraphy.stratigraphy;
    
    console.log('Processing editing stratigraphy:', editingData);
    
    // Remove the old version if it exists and add the updated one
    stratigraphiesToProcess = stratigraphiesToProcess.filter(s => s.id !== editingId);
    stratigraphiesToProcess.push(editingData);
  }
  
  return stratigraphiesToProcess.map(strat => {
    const supplierName = extractSupplierName(strat.layers);
    
    console.log('Processing stratigraphy:', {
      name: strat.name,
      type: strat.type,
      layersCount: strat.layers?.length || 0,
      extractedSupplier: supplierName
    });
    
    return {
      id: strat.id,
      name: strat.name,
      description: strat.description || '',
      type: strat.type,
      is_certified: strat.is_certified,
      fire_resistance_class: strat.fire_resistance_class || null,
      acoustic_performance: strat.acoustic_performance || null,
      supplier_name: supplierName,
      certification_id: strat.certification_id || null,
      total_thickness: strat.total_thickness,
      weight_per_sqm: strat.weight_per_sqm || null,
      thermal_performance: strat.thermal_performance || null,
      cost_per_sqm: strat.cost_per_sqm || null,
      installation_time_per_sqm: strat.installation_time_per_sqm || null,
      user_id: strat.user_id || null,
      created_at: strat.created_at,
      updated_at: strat.updated_at,
      layers: strat.layers || []
    };
  }) as UnifiedStratigraphy[];
};
