
import { MaterialCategory } from '@/types';

export interface DatabaseLayer {
  id: string;
  material_id: string;
  thickness: number;
  position: number;
  inter_axis?: number;
  materials?: {
    id: string;
    name: string;
    category: MaterialCategory;
    color_hex: string;
    unit: string;
    unit_price: number;
    supplier: string;
    code: string;
    description: string;
    width?: number;
    length?: number;
    weight_per_sqm?: number;
    thermal_conductivity?: number;
    acoustic_performance?: number;
    fire_resistance_class?: string;
    incidence_per_sqm?: number;
    discount?: number;
    valid_until?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface StructuralGroupDb {
  id: string;
  type: 'structural' | 'standalone';
  startPosition: number;
  endPosition: number;
  layers: DatabaseLayer[];
  guides: DatabaseLayer[];
  structure?: DatabaseLayer;
  internalInsulation: DatabaseLayer[];
  totalThickness: number;
}

export const calculateActualThicknessFromDatabase = (layers: DatabaseLayer[]): number => {
  const structuralGroups = identifyStructuralGroupsFromDatabase(layers);
  
  const total = structuralGroups.reduce((sum, group) => {
    if (group.type === 'structural') {
      // For structural groups, only count structure + external layers, not guides or internal insulation
      const structureThickness = group.structure?.thickness || 0;
      return sum + structureThickness;
    } else {
      // For standalone layers, count normally but exclude guides
      return sum + group.layers.reduce((layerSum, layer) => {
        if (isGuideDb(layer.materials)) return layerSum;
        return layerSum + (layer.thickness || 0);
      }, 0);
    }
  }, 0);
  
  // Round to 1 decimal place to handle floating point precision
  return Math.round(total * 10) / 10;
};

export const identifyStructuralGroupsFromDatabase = (layers: DatabaseLayer[]): StructuralGroupDb[] => {
  const sortedLayers = [...layers].sort((a, b) => a.position - b.position);
  const groups: StructuralGroupDb[] = [];
  let currentGroup: DatabaseLayer[] = [];
  let groupStartPos = 0;

  for (let i = 0; i < sortedLayers.length; i++) {
    const layer = sortedLayers[i];
    const isCurrentGuide = isGuideDb(layer.materials);
    const isCurrentStructure = isStructureDb(layer.materials);
    const isCurrentInsulation = isInsulationDb(layer.materials);

    // Start a new group if we encounter a guide or if the current group is empty
    if (currentGroup.length === 0) {
      currentGroup = [layer];
      groupStartPos = i;
      continue;
    }

    // Check if this layer belongs to the current structural group
    const hasGuideInGroup = currentGroup.some(l => isGuideDb(l.materials));
    const hasStructureInGroup = currentGroup.some(l => isStructureDb(l.materials));

    if (hasGuideInGroup || hasStructureInGroup) {
      // We're in a potential structural group
      if (isCurrentGuide || isCurrentStructure || isCurrentInsulation) {
        // Add to current group
        currentGroup.push(layer);
        continue;
      } else {
        // End current group and start new one
        groups.push(createStructuralGroupDb(currentGroup, groupStartPos));
        currentGroup = [layer];
        groupStartPos = i;
      }
    } else {
      // Current group has no structural elements
      if (isCurrentGuide || isCurrentStructure) {
        // Start a new structural group
        groups.push(createStandaloneGroupDb(currentGroup, groupStartPos));
        currentGroup = [layer];
        groupStartPos = i;
      } else {
        // Add to current standalone group
        currentGroup.push(layer);
      }
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push(createStructuralGroupDb(currentGroup, groupStartPos));
  }

  return groups;
};

const createStructuralGroupDb = (layers: DatabaseLayer[], startPos: number): StructuralGroupDb => {
  const guides = layers.filter(l => isGuideDb(l.materials));
  const structures = layers.filter(l => isStructureDb(l.materials));
  const insulation = layers.filter(l => isInsulationDb(l.materials));

  const isStructuralGroup = guides.length > 0 || structures.length > 0;
  const structure = structures[0];

  // Calculate total thickness for the group - EXCLUDE GUIDES
  let totalThickness = 0;
  if (isStructuralGroup && structure) {
    // For structural groups, only count the main structure thickness
    totalThickness = structure.thickness || 0;
  } else {
    // For other groups, count all layers except guides
    totalThickness = layers.reduce((sum, layer) => {
      if (isGuideDb(layer.materials)) return sum;
      return sum + (layer.thickness || 0);
    }, 0);
  }

  return {
    id: `group-${startPos}-${layers.map(l => l.id).join('-')}`,
    type: isStructuralGroup ? 'structural' : 'standalone',
    startPosition: startPos,
    endPosition: startPos + layers.length - 1,
    layers,
    guides,
    structure,
    internalInsulation: insulation,
    totalThickness
  };
};

const createStandaloneGroupDb = (layers: DatabaseLayer[], startPos: number): StructuralGroupDb => {
  // Exclude guides from thickness calculation
  const totalThickness = layers.reduce((sum, layer) => {
    if (isGuideDb(layer.materials)) return sum;
    return sum + (layer.thickness || 0);
  }, 0);

  return {
    id: `standalone-${startPos}-${layers.map(l => l.id).join('-')}`,
    type: 'standalone',
    startPosition: startPos,
    endPosition: startPos + layers.length - 1,
    layers,
    guides: [],
    structure: undefined,
    internalInsulation: [],
    totalThickness
  };
};

export const isInsulationDb = (material?: DatabaseLayer['materials']): boolean => {
  return material?.category === 'insulation';
};

export const isStructureDb = (material?: DatabaseLayer['materials']): boolean => {
  return material?.category === 'structure_frame';
};

export const isGuideDb = (material?: DatabaseLayer['materials']): boolean => {
  return material?.category === 'structure_guide';
};
