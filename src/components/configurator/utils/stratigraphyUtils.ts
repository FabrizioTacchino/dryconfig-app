
import { Layer } from '../types/StratigraphyTypes';
import { DatabaseMaterial } from '@/hooks/useMaterials';

export interface StructuralGroup {
  id: string;
  type: 'structural' | 'standalone';
  startPosition: number;
  endPosition: number;
  layers: Layer[];
  guides: Layer[];
  structure?: Layer;
  internalInsulation: Layer[];
  totalThickness: number;
}

export const calculateActualThickness = (layers: Layer[]): number => {
  const structuralGroups = identifyStructuralGroups(layers);
  
  const total = structuralGroups.reduce((sum, group) => {
    if (group.type === 'structural') {
      // For structural groups, only count structure + external layers, not guides or internal insulation
      const structureThickness = group.structure ? getLayerActualThickness(group.structure) : 0;
      return sum + structureThickness;
    } else {
      // For standalone layers, count normally but exclude guides and accessories
      return sum + group.layers.reduce((layerSum, layer) => {
        if (isGuide(layer.material) || isAccessory(layer.material)) return layerSum;
        return layerSum + getLayerActualThickness(layer);
      }, 0);
    }
  }, 0);
  
  // Round to 1 decimal place to handle floating point precision
  return Math.round(total * 10) / 10;
};

// Nuova funzione per ottenere lo spessore effettivo del layer
export const getLayerActualThickness = (layer: Layer): number => {
  // Gli accessori (viti, angolari, nastro, stucco) non contribuiscono allo spessore
  if (isAccessory(layer.material)) {
    console.log(`[getLayerActualThickness] Accessory ${layer.material?.name} does not contribute to thickness`);
    return 0;
  }
  
  // Se il materiale ha uno spessore definito, usa quello
  if (layer.material && typeof layer.material.thickness === 'number' && layer.material.thickness > 0) {
    console.log(`[getLayerActualThickness] Using material thickness for ${layer.material.name}: ${layer.material.thickness}mm`);
    return layer.material.thickness;
  }
  
  // Altrimenti usa lo spessore del layer
  const layerThickness = layer.thickness || 0;
  console.log(`[getLayerActualThickness] Using layer thickness for ${layer.material?.name || 'unknown'}: ${layerThickness}mm`);
  return layerThickness;
};

export const calculateTotalThicknessExcludingGuides = (layers: Layer[]): number => {
  // Calculate thickness excluding guides and accessories completely
  return layers.reduce((sum, layer) => {
    // Skip guides and accessories in thickness calculation
    if (isGuide(layer.material) || isAccessory(layer.material)) return sum;
    return sum + getLayerActualThickness(layer);
  }, 0);
};

export const identifyStructuralGroups = (layers: Layer[]): StructuralGroup[] => {
  const sortedLayers = [...layers].sort((a, b) => a.position - b.position);
  const groups: StructuralGroup[] = [];
  let currentGroup: Layer[] = [];
  let groupStartPos = 0;

  console.log('[identifyStructuralGroups] 🏗️ ANALYZING LAYERS:', sortedLayers.map(l => ({
    id: l.id,
    name: l.material?.name,
    category: l.material?.category,
    thickness: l.thickness,
    materialThickness: l.material?.thickness,
    isAccessory: isAccessory(l.material)
  })));

  for (let i = 0; i < sortedLayers.length; i++) {
    const layer = sortedLayers[i];
    const isCurrentGuide = isGuide(layer.material);
    const isCurrentStructure = isStructure(layer.material);
    const isCurrentInsulation = isInsulation(layer.material);
    const isCurrentBoard = isBoard(layer.material);
    const isCurrentAccessory = isAccessory(layer.material);

    console.log('[identifyStructuralGroups] 🔍 ANALYZING LAYER:', {
      index: i,
      name: layer.material?.name,
      category: layer.material?.category,
      isGuide: isCurrentGuide,
      isStructure: isCurrentStructure,
      isInsulation: isCurrentInsulation,
      isBoard: isCurrentBoard,
      isAccessory: isCurrentAccessory
    });

    // Start a new group if we encounter a guide or if the current group is empty
    if (currentGroup.length === 0) {
      currentGroup = [layer];
      groupStartPos = i;
      continue;
    }

    // Check if this layer belongs to the current structural group
    const hasGuideInGroup = currentGroup.some(l => isGuide(l.material));
    const hasStructureInGroup = currentGroup.some(l => isStructure(l.material));

    if (hasGuideInGroup || hasStructureInGroup) {
      // We're in a potential structural group
      if (isCurrentGuide || isCurrentStructure || isCurrentInsulation || isCurrentAccessory) {
        // Add to current group (accessories can be part of structural groups)
        currentGroup.push(layer);
        continue;
      } else {
        // End current group and start new one (for boards and other materials)
        console.log('[identifyStructuralGroups] 🔚 ENDING STRUCTURAL GROUP, STARTING NEW');
        groups.push(createStructuralGroup(currentGroup, groupStartPos));
        currentGroup = [layer];
        groupStartPos = i;
      }
    } else {
      // Current group has no structural elements
      if (isCurrentGuide || isCurrentStructure) {
        // Start a new structural group
        console.log('[identifyStructuralGroups] 🏗️ STARTING NEW STRUCTURAL GROUP');
        groups.push(createStandaloneGroup(currentGroup, groupStartPos));
        currentGroup = [layer];
        groupStartPos = i;
      } else if (isCurrentBoard) {
        // Boards should be in their own groups for proper rendering
        console.log('[identifyStructuralGroups] 🟫 BOARD DETECTED - CREATING SEPARATE GROUP');
        groups.push(createStandaloneGroup(currentGroup, groupStartPos));
        currentGroup = [layer];
        groupStartPos = i;
      } else {
        // Add to current standalone group (including accessories)
        currentGroup.push(layer);
      }
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    console.log('[identifyStructuralGroups] 🔚 ADDING FINAL GROUP');
    groups.push(createStructuralGroup(currentGroup, groupStartPos));
  }

  console.log('[identifyStructuralGroups] ✅ FINAL GROUPS:', groups.map(g => ({
    id: g.id,
    type: g.type,
    layersCount: g.layers.length,
    totalThickness: g.totalThickness,
    layers: g.layers.map(l => ({ name: l.material?.name, category: l.material?.category }))
  })));

  return groups;
};

const createStructuralGroup = (layers: Layer[], startPos: number): StructuralGroup => {
  const guides = layers.filter(l => isGuide(l.material));
  const structures = layers.filter(l => isStructure(l.material));
  const insulation = layers.filter(l => isInsulation(l.material));
  const accessories = layers.filter(l => isAccessory(l.material));
  const others = layers.filter(l => !isGuide(l.material) && !isStructure(l.material) && !isInsulation(l.material) && !isAccessory(l.material));

  const isStructuralGroup = guides.length > 0 || structures.length > 0;
  const structure = structures[0];

  // Calculate total thickness for the group - EXCLUDE GUIDES AND ACCESSORIES
  let totalThickness = 0;
  if (isStructuralGroup && structure) {
    // For structural groups, only count the main structure thickness
    totalThickness = getLayerActualThickness(structure);
  } else {
    // For other groups, count all layers except guides and accessories
    totalThickness = layers.reduce((sum, layer) => {
      if (isGuide(layer.material) || isAccessory(layer.material)) return sum;
      return sum + getLayerActualThickness(layer);
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

const createStandaloneGroup = (layers: Layer[], startPos: number): StructuralGroup => {
  // Exclude guides and accessories from thickness calculation, usa spessore effettivo
  const totalThickness = layers.reduce((sum, layer) => {
    if (isGuide(layer.material) || isAccessory(layer.material)) return sum;
    return sum + getLayerActualThickness(layer);
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

export const calculateStratigraphyCost = (layers: Layer[]): number => {
  return layers.reduce((sum, layer) => {
    if (!layer.material) return sum;
    
    const materialCost = layer.material.unit_price || 0;
    // Use 1 as default incidence if not available
    const incidence = 1;
    const thicknessInMeters = getLayerActualThickness(layer) / 1000;
    
    return sum + (materialCost * incidence * thicknessInMeters);
  }, 0);
};

export const calculateStratigraphyWeight = (layers: Layer[]): number => {
  return layers.reduce((sum, layer) => {
    if (!layer.material) return sum;
    
    const weightPerSqm = layer.material.weight_per_sqm || 0;
    const thicknessInMeters = getLayerActualThickness(layer) / 1000;
    
    return sum + (weightPerSqm * thicknessInMeters);
  }, 0);
};

export const isInsulation = (material?: DatabaseMaterial): boolean => {
  return material?.category === 'insulation';
};

export const isStructure = (material?: DatabaseMaterial): boolean => {
  return material?.category === 'structure_frame';
};

export const isGuide = (material?: DatabaseMaterial): boolean => {
  return material?.category === 'structure_guide';
};

export const isBoard = (material?: DatabaseMaterial): boolean => {
  return material?.category === 'board';
};

// NUOVA FUNZIONE: Identifica gli accessori che non contribuiscono allo spessore
export const isAccessory = (material?: DatabaseMaterial): boolean => {
  return material?.category === 'accessory' || material?.category === 'screw';
};

export const getGuidesForStructure = (layers: Layer[], structureIndex: number): Layer[] => {
  const guides: Layer[] = [];
  
  // Look for guides before and after the structure
  if (structureIndex > 0) {
    const prevLayer = layers[structureIndex - 1];
    if (isGuide(prevLayer.material)) {
      guides.push(prevLayer);
    }
  }
  
  if (structureIndex < layers.length - 1) {
    const nextLayer = layers[structureIndex + 1];
    if (isGuide(nextLayer.material)) {
      guides.push(nextLayer);
    }
  }
  
  return guides;
};
