
import React, { useEffect, useState } from 'react';
import { GripVertical, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types';
import LayerThicknessInput from './LayerThicknessInput';
import LayerMaterialSelect from './LayerMaterialSelect';
import GroupedMaterialSelect from './GroupedMaterialSelect';
import LayerDetails from './LayerDetails';
import CategorySelector from './CategorySelector';
import LayerInterAxisInput from './LayerInterAxisInput';
import { calculateLayerCostPerSqm } from '../utils/costCalculationUtils';

interface Layer {
  id: string;
  materialId: string;
  material?: DatabaseMaterial;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
  calculatedCostPerSqm?: number;
  screwMaterialId?: string;
  screwMaterial?: DatabaseMaterial;
  screwQuantity?: number;
  screwCostPerSqm?: number;
}

interface LayerItemProps {
  layer: Layer;
  index: number;
  availableMaterials: DatabaseMaterial[];
  isDragged: boolean;
  isDraggedOver: boolean;
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
  onCostChange?: (layerId: string, cost: number) => void;
  onQuantityChange?: (layerId: string, quantity: number) => void;
  isEditMode?: boolean;
  finishLevel?: string;
  finishLevels?: { finish_level: string; cost_multiplier: number; time_multiplier: number }[];
}

const LayerItem = ({
  layer,
  index,
  availableMaterials,
  isDragged,
  isDraggedOver,
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
  onCostChange,
  onQuantityChange,
  isEditMode = false,
  finishLevel,
  finishLevels
}: LayerItemProps) => {
  console.log(`[LayerItem] 🔧 LAYER ${layer.position} - RENDERING:`, {
    layerId: layer.id,
    materialName: layer.material?.name,
    category: layer.category,
    thickness: layer.thickness
  });

  const filteredMaterials = availableMaterials.filter(material => material.category === layer.category);

  useEffect(() => {
    if (layer.material && onCostChange) {
      const calculatedCost = calculateLayerCostPerSqm(layer.material, layer.interAxis);
      onCostChange(layer.id, calculatedCost);
    }
  }, [layer.material, layer.interAxis, layer.id, onCostChange]);

  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = availableMaterials.find(m => m.id === materialId);
    
    console.log(`[LayerItem] 🔧 MATERIAL CHANGE for layer ${layer.position}:`, {
      materialId,
      materialName: selectedMaterial?.name,
      category: selectedMaterial?.category
    });
    
    onMaterialChange(layer.id, materialId);
    
    if (selectedMaterial && onAutoSuggestCheck) {
      console.log(`[LayerItem] 🎯 TRIGGERING AUTO-SUGGEST CHECK for layer ${layer.position}`);
      onAutoSuggestCheck(selectedMaterial, layer.id);
    }
  };

  const handleInterAxisChange = (interAxis: number) => {
    onInterAxisChange(layer.id, interAxis);
  };

  const containerClasses = `border rounded-lg p-4 bg-white cursor-move transition-all space-y-3
    ${isDragged ? 'opacity-50' : ''}
    ${isDraggedOver ? 'border-construction-primary bg-construction-primary/5' : 'border-gray-200'}
    hover:border-gray-300`;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, layer.id)}
      onDragOver={e => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={e => onDrop(e, index)}
      className={containerClasses}
    >
      <div className="flex items-start gap-3">
        <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
        <div className="flex-1 space-y-3">
          <CategorySelector
            selectedCategory={layer.category}
            onCategoryChange={category => onCategoryChange(layer.id, category)}
          />
          
          {layer.category === 'board' ? (
            <GroupedMaterialSelect
              material_id={layer.materialId}
              materials={filteredMaterials}
              onMaterialChange={handleMaterialChange}
            />
          ) : (
            <LayerMaterialSelect
              material_id={layer.materialId}
              materials={filteredMaterials}
              onMaterialChange={handleMaterialChange}
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <LayerThicknessInput
            thickness={layer.thickness}
            material={layer.material}
            onThicknessChange={thickness => onThicknessChange(layer.id, thickness)}
          />
          
          <Button
            onClick={() => onDuplicateLayer(layer.id)}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Duplica layer"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onRemoveLayer(layer.id)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Elimina layer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {layer.material?.category === 'structure_frame' && (
        <div className="flex items-center gap-2 ml-7 pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-600 font-medium min-w-fit">Passo dei Montanti:</span>
          <LayerInterAxisInput
            value={layer.interAxis || 600}
            onChange={handleInterAxisChange}
          />
          <span className="text-sm text-gray-500">mm</span>
        </div>
      )}
      
      <LayerDetails
        material={layer.material}
        passo={layer.interAxis}
        finishLevel={finishLevel}
        finishLevels={finishLevels}
      />
    </div>
  );
};

export default LayerItem;
