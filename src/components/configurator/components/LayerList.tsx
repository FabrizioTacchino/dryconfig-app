
import React from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import LayerItem from './LayerItem';
import { useLayerListLogic } from './LayerListLogic';

interface Layer {
  id: string;
  materialId: string;
  material?: DatabaseMaterial;
  thickness: number;
  position: number;
  category: any;
  interAxis?: number;
  calculatedCostPerSqm?: number;
  parentLayerId?: string;
  equalPartsQuantity?: number;
}

interface LayerListProps {
  layers: Layer[];
  availableMaterials: DatabaseMaterial[];
  onLayersChange: (layers: Layer[]) => void;
  onAutoSuggestCheck?: (selectedMaterial: DatabaseMaterial, layerId: string) => void;
  isEditMode?: boolean;
}

const LayerList = ({
  layers,
  availableMaterials,
  onLayersChange,
  onAutoSuggestCheck,
  isEditMode = false
}: LayerListProps) => {
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
    handleCostChange,
    handleQuantityChange
  } = useLayerListLogic({
    layers,
    availableMaterials,
    onLayersChange,
    onAutoSuggestCheck
  });

  console.log('[LayerList] 🔧 SIMPLIFIED APPROACH - RENDERING ALL LAYERS:', {
    layersCount: layers.length,
    screwLayers: layers.filter(l => l.category === 'screw').length,
    boardLayers: layers.filter(l => l.category === 'board').length,
    otherLayers: layers.filter(l => !['screw', 'board'].includes(l.category)).length
  });

  return (
    <div className="space-y-4">
      {layers.map((layer, index) => {
        console.log(`[LayerList] 📋 RENDERING LAYER ${layer.position}:`, {
          layerId: layer.id,
          materialName: layer.material?.name,
          category: layer.category,
          isScrew: layer.category === 'screw',
          quantity: layer.equalPartsQuantity,
          thickness: layer.thickness
        });
        
        return (
          <LayerItem
            key={layer.id}
            layer={layer}
            index={index}
            availableMaterials={availableMaterials}
            isDragged={draggedLayer === layer.id}
            isDraggedOver={dragOverIndex === index}
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
            onQuantityChange={handleQuantityChange}
            isEditMode={isEditMode}
          />
        );
      })}
      
      {/* Debug info */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-sm">
        <strong>SIMPLIFIED APPROACH - Layers in system ({layers.length}):</strong>
        <ul className="mt-1">
          {layers.map(layer => (
            <li key={layer.id} className="text-xs text-gray-600">
              {layer.position}. {layer.material?.name || 'Nessun materiale'} 
              ({layer.category})
              - Thickness: {layer.thickness}mm
              {layer.equalPartsQuantity ? ` - Quantity: ${layer.equalPartsQuantity}/m²` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LayerList;
