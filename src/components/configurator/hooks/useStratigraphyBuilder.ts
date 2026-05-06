
import { useState, useEffect } from 'react';
import { MaterialCategory, WallType } from '@/types';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { determineWallType } from '../utils/wallTypeDetection';

interface Layer {
  id: string;
  materialId: string;
  material?: DatabaseMaterial;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
  calculatedCostPerSqm?: number;
}

interface StratigraphyData {
  name: string;
  description: string;
  layers: Layer[];
  totalThickness: number;
  estimatedCost: number;
  wallType: WallType;
  weightPerSqm: number;
}

export const useStratigraphyBuilder = (
  onStratigraphyChange?: (data: StratigraphyData) => void,
  editingStratigraphy?: any
) => {
  const [stratigraphyName, setStratigraphyName] = useState('');
  const [stratigraphyDescription, setStratigraphyDescription] = useState('');
  const [layers, setLayers] = useState<Layer[]>([]);

  // Calculated values
  const wallType = determineWallType(layers);
  const totalThickness = layers.reduce((sum, layer) => sum + (layer.thickness || 0), 0);
  
  // Cost calculation using saved calculated costs from layers
  const estimatedCost = layers.reduce((sum, layer) => {
    if (layer.materialId && layer.calculatedCostPerSqm !== undefined) {
      console.log(`useStratigraphyBuilder - Using saved cost for ${layer.material?.name}: ${layer.calculatedCostPerSqm}`);
      return sum + layer.calculatedCostPerSqm;
    }
    return sum;
  }, 0);

  console.log(`useStratigraphyBuilder - Total estimatedCost: ${estimatedCost}`);

  const weightPerSqm = layers.reduce((sum, layer) => {
    if (layer.material) {
      const incidence = layer.material.incidence_per_sqm || 1;
      const weight = (layer.material.weight_per_sqm || 0) * incidence;
      return sum + weight;
    }
    return sum;
  }, 0);

  // Validation
  const isNameValid = stratigraphyName.trim().length > 0;
  const hasValidLayers = layers.filter(layer => layer.materialId && layer.thickness > 0).length > 0;
  const canSave = isNameValid && hasValidLayers;

  // Initialize from existing stratigraphy when editing
  const initializeFromExisting = (stratigraphy: any) => {
    if (!stratigraphy) return;

    console.log('Initializing from existing stratigraphy:', stratigraphy);
    
    setStratigraphyName(stratigraphy.name || '');
    setStratigraphyDescription(stratigraphy.description || '');
    
    if (stratigraphy.layers && Array.isArray(stratigraphy.layers)) {
      const initializedLayers = stratigraphy.layers.map((layer: any, index: number) => ({
        id: `layer-${Date.now()}-${index}`,
        materialId: layer.material_id || layer.materialId || '',
        material: layer.materials || layer.material,
        thickness: layer.thickness || 10,
        position: layer.position || index + 1,
        category: (layer.materials?.category || layer.material?.category || 'board') as MaterialCategory,
        interAxis: layer.inter_axis || layer.interAxis,
        calculatedCostPerSqm: 0, // Will be calculated when materials are loaded
      }));
      
      console.log('Initialized layers:', initializedLayers);
      setLayers(initializedLayers);
    }
  };

  // Effect to initialize when editing stratigraphy is provided
  useEffect(() => {
    if (editingStratigraphy) {
      initializeFromExisting(editingStratigraphy);
    }
  }, [editingStratigraphy]);

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}-${Math.random()}`,
      materialId: '',
      thickness: 10,
      position: layers.length + 1,
      category: 'board' as MaterialCategory,
      calculatedCostPerSqm: 0,
    };
    setLayers([...layers, newLayer]);
  };

  const resetForm = () => {
    setStratigraphyName('');
    setStratigraphyDescription('');
    setLayers([]);
  };

  // Notify parent component of changes
  useEffect(() => {
    if (onStratigraphyChange) {
      onStratigraphyChange({
        name: stratigraphyName,
        description: stratigraphyDescription,
        layers,
        totalThickness,
        estimatedCost,
        wallType,
        weightPerSqm,
      });
    }
  }, [stratigraphyName, stratigraphyDescription, layers, totalThickness, estimatedCost, wallType, weightPerSqm, onStratigraphyChange]);

  return {
    stratigraphyName,
    setStratigraphyName,
    stratigraphyDescription,
    setStratigraphyDescription,
    layers,
    setLayers,
    wallType,
    totalThickness,
    estimatedCost,
    weightPerSqm,
    isNameValid,
    hasValidLayers,
    canSave,
    handleAddLayer,
    resetForm,
    initializeFromExisting,
  };
};
