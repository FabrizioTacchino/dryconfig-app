
import React from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types';
import LayerItem from './LayerItem';
import EmptyLayerState from './EmptyLayerState';

interface Layer {
  id: string;
  materialId: string;
  material?: DatabaseMaterial;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
  calculatedCostPerSqm?: number;
  customScrews?: { screwId: string; quantity: number };
}

interface LayerListContentProps {
  layers: Layer[];
  availableMaterials: DatabaseMaterial[];
  draggedLayer: string | null;
  dragOverIndex: number | null;
  onDragStart: (e: React.DragEvent, layerId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  onThicknessChange: (layerId: string, thickness: number) => void;
  onMaterialChange: (layerId: string, materialId: string) => void;
  onCategoryChange: (layerId: string, category: MaterialCategory) => void;
  onInterAxisChange: (layerId: string, interAxis: number) => void;
  onRemoveLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onAutoSuggestCheck?: (selectedMaterial: DatabaseMaterial, layerId: string) => void;
  onCostChange?: (layerId: string, cost: number, customScrews?: { screwId: string; quantity: number }) => void;
}

const LayerListContent = ({
  layers,
  availableMaterials,
  draggedLayer,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onThicknessChange,
  onMaterialChange,
  onCategoryChange,
  onInterAxisChange,
  onRemoveLayer,
  onDuplicateLayer,
  onAutoSuggestCheck,
  onCostChange
}: LayerListContentProps) => {
  const sortedLayers = [...layers].sort((a, b) => a.position - b.position);

  if (sortedLayers.length === 0) {
    return <EmptyLayerState />;
  }

  return (
    <div className="space-y-3">
      {sortedLayers.map((layer, index) => (
        <LayerItem
          key={layer.id}
          layer={layer}
          index={index}
          availableMaterials={availableMaterials}
          isDragged={draggedLayer === layer.id}
          isDraggedOver={dragOverIndex === index}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e, dropIndex) => onDrop(e, dropIndex)}
          onThicknessChange={onThicknessChange}
          onMaterialChange={onMaterialChange}
          onCategoryChange={onCategoryChange}
          onInterAxisChange={onInterAxisChange}
          onRemoveLayer={onRemoveLayer}
          onDuplicateLayer={onDuplicateLayer}
          onAutoSuggestCheck={onAutoSuggestCheck}
          onCostChange={onCostChange}
        />
      ))}
    </div>
  );
};

export default LayerListContent;
