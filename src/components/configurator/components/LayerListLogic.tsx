import { useState } from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types';
import { hasVariableThickness, getDefaultThickness } from '../utils/materialUtils';
import { createDragHandlers } from '../utils/dragAndDropUtils';
import { calculateLayerCostPerSqm } from '../utils/costCalculationUtils';
import { Layer } from '../types/StratigraphyTypes';

interface LayerListLogicProps {
  layers: Layer[];
  availableMaterials: DatabaseMaterial[];
  onLayersChange: (layers: Layer[]) => void;
  onAutoSuggestCheck?: (selectedMaterial: DatabaseMaterial, layerId: string) => void;
}

export const useLayerListLogic = ({
  layers,
  availableMaterials,
  onLayersChange,
  onAutoSuggestCheck
}: LayerListLogicProps) => {
  const [draggedLayer, setDraggedLayer] = useState<string>('');
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);

  const dragHandlers = createDragHandlers(
    layers,
    onLayersChange,
    setDraggedLayer,
    setDragOverIndex
  );

  const handleRemoveLayer = (layerId: string) => {
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    onLayersChange(updatedLayers);
  };

  const handleDuplicateLayer = (layerId: string) => {
    const layerToDuplicate = layers.find(l => l.id === layerId);
    if (!layerToDuplicate) return;

    const newLayer = {
      ...layerToDuplicate,
      id: `layer-${Date.now()}-${Math.random()}`,
      position: layers.length + 1
    };

    onLayersChange([...layers, newLayer]);
  };

  const handleThicknessChange = (layerId: string, thickness: number) => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        const updatedLayer = { ...layer, thickness };
        if (updatedLayer.material) {
          const calculatedCost = calculateLayerCostPerSqm(updatedLayer.material, thickness);
          return { ...updatedLayer, calculatedCostPerSqm: calculatedCost };
        }
        return updatedLayer;
      }
      return layer;
    });
    onLayersChange(updatedLayers);
  };

  const handleMaterialChange = (layerId: string, materialId: string) => {
    const selectedMaterial = availableMaterials.find(m => m.id === materialId);
    if (!selectedMaterial) return;

    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        const defaultThickness = hasVariableThickness(selectedMaterial) 
          ? layer.thickness 
          : getDefaultThickness(selectedMaterial);
        
        const updatedLayer = {
          ...layer,
          materialId,
          material: selectedMaterial,
          thickness: defaultThickness,
          category: selectedMaterial.category as MaterialCategory
        };
        
        // Fix: Pass the selectedMaterial (DatabaseMaterial) and use layer's interAxis if available
        const calculatedCost = calculateLayerCostPerSqm(selectedMaterial, layer.interAxis);
        const finalLayer = { ...updatedLayer, calculatedCostPerSqm: calculatedCost };
        
        if (onAutoSuggestCheck) {
          onAutoSuggestCheck(selectedMaterial, layerId);
        }
        
        return finalLayer;
      }
      return layer;
    });
    onLayersChange(updatedLayers);
  };

  const handleCategoryChange = (layerId: string, category: MaterialCategory) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, category, materialId: '' } : layer
    );
    onLayersChange(updatedLayers);
  };

  const handleInterAxisChange = (layerId: string, interAxis: number) => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        const updatedLayer = { ...layer, interAxis };
        if (updatedLayer.material) {
          const calculatedCost = calculateLayerCostPerSqm(updatedLayer.material, updatedLayer.interAxis);
          return { ...updatedLayer, calculatedCostPerSqm: calculatedCost };
        }
        return updatedLayer;
      }
      return layer;
    });
    onLayersChange(updatedLayers);
  };

  const handleCostChange = (layerId: string, cost: number) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, calculatedCostPerSqm: cost } : layer
    );
    onLayersChange(updatedLayers);
  };

  const handleQuantityChange = (layerId: string, quantity: number) => {
    // For integrated system, quantity changes are handled via screw selection
    console.log('[LayerListLogic] handleQuantityChange called for integrated system:', { layerId, quantity });
  };

  return {
    draggedLayer,
    dragOverIndex,
    dragHandlers,
    handleRemoveLayer,
    handleDuplicateLayer,
    handleThicknessChange,
    handleMaterialChange,
    handleCategoryChange,
    handleInterAxisChange,
    handleCostChange,
    handleQuantityChange
  };
};
