import { useMemo } from 'react';
import { MaterialCategory } from '@/types';

interface CertifiedMaterial {
  id: string;
  certification_id: string;
  position_type: string;
  position_side?: string;
  material_description: string;
  material_code?: string;
  thickness?: number;
  specifications?: string;
  position_order?: number;
}

interface AdaptedLayer {
  id: string;
  materialId: string;
  material: {
    id: string;
    name: string;
    description?: string;
    code: string;
    category: MaterialCategory;
    color_hex: string;
    supplier?: string;
    unit_cost?: number;
  };
  thickness: number;
  position: number;
  category: MaterialCategory;
}

export const getCategoryFromPositionType = (positionType: string): MaterialCategory => {
  const typeMapping: Record<string, MaterialCategory> = {
    'board': 'board',
    'insulation': 'insulation',
    'structure_frame': 'structure_frame',
    'structure_guide': 'structure_guide',
    'screw': 'screw',
    // Map other position types to valid categories
    'vapor_barrier': 'accessory',
    'waterproofing': 'accessory',
    'finish': 'board',
    'acoustic': 'insulation',
    'thermal': 'insulation',
    'other': 'other'
  };
  
  return typeMapping[positionType] || 'board';
};

// Aggiunto "screw" nei mapping di colore
const getColorForCategory = (category: MaterialCategory): string => {
  const colorMapping: Record<MaterialCategory, string> = {
    'board': '#8B5CF6',
    'insulation': '#F59E0B',
    'structure_frame': '#EF4444',
    'structure_guide': '#DC2626',
    'accessory': '#10B981',
    'screw': '#444444',
    'other': '#D3D3D3'
  };
  
  return colorMapping[category] || '#CCCCCC';
};

export const useCertifiedMaterialsAdapter = (materials: CertifiedMaterial[] = []) => {
  const adaptedLayers = useMemo(() => {
    return materials
      .filter(material => material.thickness && material.thickness > 0)
      .map((material): AdaptedLayer => {
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
            supplier: undefined, // Will be filled from certification data
            unit_cost: undefined
          },
          thickness: material.thickness || 10,
          position: material.position_order || 1,
          category
        };
      })
      .sort((a, b) => a.position - b.position);
  }, [materials]);

  const totalThickness = useMemo(() => {
    return adaptedLayers.reduce((sum, layer) => sum + layer.thickness, 0);
  }, [adaptedLayers]);

  return {
    adaptedLayers,
    totalThickness
  };
};
