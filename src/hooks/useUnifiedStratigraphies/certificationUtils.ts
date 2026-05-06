
import { useMemo } from 'react';
import { WallType } from '@/types';
import { UnifiedStratigraphy } from './types';
import { getCategoryFromPositionType } from '../useCertifiedMaterialsAdapter';

const getColorForCategory = (category: any): string => {
  const colorMapping: Record<string, string> = {
    'board': '#8B5CF6',
    'insulation': '#F59E0B',
    'structure_frame': '#EF4444',
    'structure_guide': '#DC2626',
    'accessory': '#10B981'
  };
  
  return colorMapping[category] || '#CCCCCC';
};

const adaptCertifiedMaterials = (materials: any[] = []) => {
  const adaptedLayers = materials
    .filter(material => material.thickness && material.thickness > 0)
    .map((material) => {
      const category = getCategoryFromPositionType(material.position_type);
      
      return {
        id: material.id,
        materialId: material.id,
        material: {
          id: material.id,
          name: material.material_description,
          description: material.specifications,
          code: material.material_code || '',
          category,
          color_hex: getColorForCategory(category),
          supplier: undefined,
          unit_cost: undefined
        },
        thickness: material.thickness || 10,
        position: material.position_order || 1,
        category
      };
    })
    .sort((a, b) => a.position - b.position);

  const totalThickness = adaptedLayers.reduce((sum, layer) => sum + layer.thickness, 0);

  return {
    adaptedLayers,
    totalThickness
  };
};

export const useCertifiedStratigraphiesConverter = (
  certifications: any[],
  existingCertifiedIds: Set<string>,
  wallType: WallType | 'all'
) => {
  return useMemo(() => {
    // Ensure we always have valid arrays to work with
    const safeCertifications = certifications || [];
    const safeExistingIds = existingCertifiedIds || new Set();
    
    const typeMapping: Record<string, WallType> = {
      'Parete Singola': 'single',
      'Parete Doppia': 'double',
      'Controparete': 'counterwall',
      'Rivestimento': 'plating',
      'Soffitto': 'ceiling'
    };

    const result = safeCertifications
      .filter(cert => {
        // Skip if this certification already has a corresponding stratigraphy
        if (safeExistingIds.has(cert.id)) {
          return false;
        }
        
        if (wallType === 'all') return true;
        const mapped = typeMapping[cert.type] === wallType;
        return mapped;
      })
      .map(cert => {
        // Use the direct adapter function instead of the hook
        const { adaptedLayers, totalThickness } = adaptCertifiedMaterials(cert.materials || []);
        
        // Calculate estimated cost from layers (simplified calculation)
        const estimatedCost = adaptedLayers.reduce((sum, layer) => {
          // Basic cost estimation: 5€ per mm of thickness per m²
          return sum + (layer.thickness * 0.5);
        }, 0);

        // Calculate estimated weight (simplified: 1 kg per mm of thickness per m²)
        const estimatedWeight = adaptedLayers.reduce((sum, layer) => {
          return sum + (layer.thickness * 0.1);
        }, 0);

        return {
          id: `cert-${cert.id}`, // Prefix to distinguish from stratigraphy IDs
          name: cert.name,
          description: `Certificazione ${cert.code} - ${cert.certifier}`,
          type: typeMapping[cert.type] || 'single' as WallType,
          is_certified: true,
          fire_resistance_class: cert.value || null,
          acoustic_performance: cert.acoustic_reduction || null,
          supplier_name: cert.supplier_name,
          certification_id: cert.id,
          total_thickness: totalThickness > 0 ? totalThickness : (cert.wall_thickness || 0),
          weight_per_sqm: estimatedWeight > 0 ? estimatedWeight : null,
          thermal_performance: null,
          cost_per_sqm: estimatedCost > 0 ? estimatedCost : null,
          installation_time_per_sqm: null,
          user_id: null,
          created_at: cert.created_at,
          updated_at: cert.updated_at,
          layers: adaptedLayers.map(layer => ({
            id: layer.id,
            material_id: layer.materialId,
            materials: layer.material, // For backward compatibility
            material: layer.material,
            thickness: layer.thickness,
            position: layer.position,
            inter_axis: undefined
          }))
        };
      }) as UnifiedStratigraphy[];

    return result;
  }, [certifications, wallType, existingCertifiedIds]);
};
