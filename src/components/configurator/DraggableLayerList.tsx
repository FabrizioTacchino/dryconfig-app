
import React from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types';
import { useLayerListLogic } from './components/LayerListLogic';
import LayerListHeader from './components/LayerListHeader';
import LayerListContent from './components/LayerListContent';
import LayerListActions from './components/LayerListActions';

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

interface DraggableLayerListProps {
  layers: Layer[];
  availableMaterials: DatabaseMaterial[];
  onLayersChange: (layers: Layer[]) => void;
  onAddLayer: () => void;
  onAutoSuggestCheck?: (selectedMaterial: DatabaseMaterial, layerId: string) => void;
}

const DraggableLayerList = ({ 
  layers, 
  availableMaterials, 
  onLayersChange, 
  onAddLayer,
  onAutoSuggestCheck
}: DraggableLayerListProps) => {
  const {
    draggedLayer,
    dragOverIndex,
    dragHandlers,
    handleRemoveLayer,
    handleDuplicateLayer,
    handleThicknessChange,
    handleMaterialChange,
    handleCategoryChange,
    handleInterAxisChange,
    handleCostChange
  } = useLayerListLogic({
    layers,
    availableMaterials,
    onLayersChange,
    onAutoSuggestCheck
  });

  return (
    <div className="space-y-4">
      <LayerListHeader />
      
      <div className="space-y-3">
        <LayerListContent
          layers={layers}
          availableMaterials={availableMaterials}
          draggedLayer={draggedLayer}
          dragOverIndex={dragOverIndex}
          onDragStart={dragHandlers.handleDragStart}
          onDragOver={dragHandlers.handleDragOver}
          onDragLeave={dragHandlers.handleDragLeave}
          onDrop={(e, dropIndex) => dragHandlers.handleDrop(e, dropIndex, draggedLayer)}
          onThicknessChange={handleThicknessChange}
          onMaterialChange={handleMaterialChange}
          onCategoryChange={handleCategoryChange}
          onInterAxisChange={handleInterAxisChange}
          onRemoveLayer={handleRemoveLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onAutoSuggestCheck={onAutoSuggestCheck}
          onCostChange={handleCostChange}
        />

        <LayerListActions onAddLayer={onAddLayer} />
      </div>
    </div>
  );
};

export default DraggableLayerList;
