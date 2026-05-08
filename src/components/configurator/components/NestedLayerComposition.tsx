
import React, { useState, useCallback } from 'react';
import { Layer } from '../types/StratigraphyTypes';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LayerItem from './LayerItem';
import IntegratedBoardLayerItem from './IntegratedBoardLayerItem';
import { useAutoSuggestStructure } from '../hooks/useAutoSuggestStructure';
import StructureSuggestionDialog from './StructureSuggestionDialog';
import { computeScrewCostPerSqm } from '@/utils/screwPricing';

interface NestedLayerCompositionProps {
  layers: Layer[];
  onLayersChange: (layers: Layer[]) => void;
  onAddLayer: () => void;
  totalThickness: number;
  availableMaterials: DatabaseMaterial[];
  isEditMode?: boolean;
  showLayerCosts?: boolean;
  finishLevel?: string; // For applying finish level multipliers
  finishLevels?: { finish_level: string; cost_multiplier: number; time_multiplier: number }[]; // Available finish levels
  advancedBreakdown?: {
    materialCost: number;
    laborCost: number;
    accessoriesCost: number;
    total: number;
  };
  accessoryCosts?: {
    cornerCost: number;
    tapeCost: number;
    puttyCost: number;
  };
  onAccessoryCostsChange?: (costs: {
    cornerCost: number;
    tapeCost: number;
    puttyCost: number;
  }) => void;
  viewOnly?: boolean;
}

interface DragLayerState {
  draggedId: string | null;
  draggedOverIndex: number | null;
}

const NestedLayerComposition = ({
  layers,
  onLayersChange,
  onAddLayer,
  totalThickness,
  availableMaterials,
  isEditMode = false,
  showLayerCosts = false,
  finishLevel,
  finishLevels,
  advancedBreakdown,
  accessoryCosts,
  onAccessoryCostsChange,
  viewOnly = false
}: NestedLayerCompositionProps) => {
  const [dragLayer, setDragLayer] = useState<DragLayerState>({
    draggedId: null,
    draggedOverIndex: null,
  });

  // 🔥 AUTO SUGGESTION SYSTEM
  const { suggestion, checkForSuggestion, clearSuggestion } = useAutoSuggestStructure();

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    if (viewOnly) return; // Disable drag in view-only mode
    e.dataTransfer.effectAllowed = 'move';
    setDragLayer({
      draggedId: layerId,
      draggedOverIndex: null,
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (viewOnly) return; // Disable drag in view-only mode
    e.preventDefault();
    setDragLayer(prev => ({
      ...prev,
      draggedOverIndex: index,
    }));
  };

  const handleDragLeave = () => {
    if (viewOnly) return; // Disable drag in view-only mode
    setDragLayer(prev => ({
      ...prev,
      draggedOverIndex: null,
    }));
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (viewOnly) return; // Disable drag in view-only mode
    e.preventDefault();
    if (!dragLayer.draggedId) return;

    const draggedIndex = layers.findIndex(layer => layer.id === dragLayer.draggedId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    const newLayers = [...layers];
    const [draggedLayer] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(dropIndex, 0, draggedLayer);

    // Ricalcola le posizioni
    const updatedLayers = newLayers.map((layer, index) => ({
      ...layer,
      position: index + 1,
    }));

    onLayersChange(updatedLayers);
    setDragLayer({ draggedId: null, draggedOverIndex: null });
  };

  const handleThicknessChange = useCallback((layerId: string, thickness: number) => {
    if (viewOnly) return; // Disable editing in view-only mode
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, thickness } : layer
    );
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange, viewOnly]);

  const handleMaterialChange = useCallback((layerId: string, materialId: string) => {
    if (viewOnly) return; // Disable editing in view-only mode
    const material = availableMaterials.find(m => m.id === materialId);
    if (!material) {
      console.warn(`Material with ID ${materialId} not found`);
      return;
    }

    const currentLayer = layers.find(l => l.id === layerId);
    
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? {
        ...layer,
        materialId: material.id,
        material: material,
        calculatedCostPerSqm: material.unit_price * (material.incidence_per_sqm || 1)
      } : layer
    );
    
    onLayersChange(updatedLayers);

    // 🔥 TRIGGER STRUCTURE SUGGESTION
    if (material.category === 'structure_frame' || material.category === 'structure_guide') {
      console.log('[NestedLayerComposition] 🔄 Checking for structure suggestions...', {
        selectedMaterial: material.name,
        category: material.category,
        supplier: material.supplier,
        thickness: material.thickness
      });
      
      checkForSuggestion(material, availableMaterials, currentLayer, updatedLayers);
    }
  }, [layers, onLayersChange, availableMaterials, checkForSuggestion, viewOnly]);

  const handleCategoryChange = useCallback((layerId: string, category: any) => {
    if (viewOnly) return; // Disable editing in view-only mode
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, category, materialId: '', material: undefined } : layer
    );
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange, viewOnly]);

  const handleInterAxisChange = useCallback((layerId: string, interAxis: number) => {
    if (viewOnly) return; // Disable editing in view-only mode
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, interAxis } : layer
    );
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange, viewOnly]);

  const handleRemoveLayer = useCallback((layerId: string) => {
    if (viewOnly) return; // Disable editing in view-only mode
    const updatedLayers = layers.filter(layer => layer.id !== layerId).map((layer, index) => ({
      ...layer,
      position: index + 1,
    }));
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange, viewOnly]);

  const handleDuplicateLayer = useCallback((layerId: string) => {
    if (viewOnly) return; // Disable editing in view-only mode
    const layerToDuplicate = layers.find(layer => layer.id === layerId);
    if (!layerToDuplicate) return;

    const duplicatedLayer = {
      ...layerToDuplicate,
      id: `layer-${Date.now()}-${Math.random()}`,
      position: layers.length + 1,
    };

    const updatedLayers = [...layers, duplicatedLayer].map((layer, index) => ({
      ...layer,
      position: index + 1,
    }));

    onLayersChange(updatedLayers);
  }, [layers, onLayersChange, viewOnly]);

  const handleScrewChange = useCallback((layerId: string, screwMaterialId: string, quantity: number) => {
    if (viewOnly) return; // Disable editing in view-only mode
    const screwMaterial = availableMaterials.find(m => m.id === screwMaterialId);
    if (!screwMaterial) {
      console.warn(`Screw material with ID ${screwMaterialId} not found`);
      return;
    }

    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        // Vite vendute a scatola: dividere unit_price per box_pieces e moltiplicare per qty/m²
        const screwCostPerSqm = computeScrewCostPerSqm(screwMaterial, quantity);
        return {
          ...layer,
          screwMaterialId: screwMaterial.id,
          screwMaterial: screwMaterial,
          screwQuantity: quantity,
          screwCostPerSqm: screwCostPerSqm
        };
      }
      return layer;
    });
    
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange, availableMaterials, viewOnly]);

  // 🔥 HANDLE SUGGESTION ACCEPTANCE
  const handleAcceptSuggestion = () => {
    if (!suggestion || viewOnly) return; // Disable suggestions in view-only mode

    console.log('[NestedLayerComposition] ✅ Accepting suggestion:', suggestion.suggestedMaterial.name);

    const newLayer = {
      id: `layer-${Date.now()}-${Math.random()}`,
      materialId: suggestion.suggestedMaterial.id,
      material: suggestion.suggestedMaterial,
      thickness: suggestion.suggestedMaterial.thickness || 50,
      position: layers.length + 1,
      category: suggestion.suggestedMaterial.category,
      calculatedCostPerSqm: suggestion.suggestedMaterial.unit_price * (suggestion.suggestedMaterial.incidence_per_sqm || 1),
    };

    const updatedLayers = [...layers, newLayer].map((layer, index) => ({
      ...layer,
      position: index + 1,
    }));

    onLayersChange(updatedLayers);
    clearSuggestion();
  };

  const renderLayerItem = (layer: Layer, index: number) => {
    console.log(`[NestedLayerComposition] 🎨 RENDERING LAYER WITH FINISH:`, {
      layerName: layer.material?.name,
      finishLevel,
      finishLevelsCount: finishLevels?.length || 0
    });
    
    const commonProps = {
      layer,
      index,
      availableMaterials,
      isDragged: dragLayer?.draggedId === layer.id,
      isDraggedOver: dragLayer?.draggedOverIndex === index,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onThicknessChange: handleThicknessChange,
      onMaterialChange: handleMaterialChange,
      onInterAxisChange: handleInterAxisChange,
      onRemoveLayer: handleRemoveLayer,
      onDuplicateLayer: handleDuplicateLayer,
      isEditMode,
      finishLevel, // Pass finish level to layer items
      finishLevels, // Pass finish levels to layer items
      viewOnly, // Pass viewOnly to layer items
    };

    if (layer.material?.category === 'board') {
      return (
        <IntegratedBoardLayerItem
          {...commonProps}
          onScrewChange={handleScrewChange}
          allLayers={layers}
        />
      );
    }

    return (
      <LayerItem 
        {...commonProps} 
        onCategoryChange={handleCategoryChange}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Composizione ({layers.length} layer{layers.length !== 1 ? 's' : ''}):</h4>
      </div>

      {layers.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          {viewOnly ? 'Nessun layer presente.' : 'Aggiungi dei layer per definire la composizione.'}
        </div>
      ) : (
        <div className="space-y-3">
          {layers.map((layer, index) => (
            <div key={layer.id}>
              {renderLayerItem(layer, index)}
            </div>
          ))}
        </div>
      )}

      {/* 🔥 ADD BUTTON - Hide in viewOnly mode */}
      {!viewOnly && (
        <div className="flex justify-center pt-4 mt-4 border-t border-gray-200">
          <Button variant="outline" size="sm" onClick={onAddLayer}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Layer
          </Button>
        </div>
      )}

      {/* 🔥 STRUCTURE SUGGESTION DIALOG - Hide in viewOnly mode */}
      {!viewOnly && (
        <StructureSuggestionDialog
          suggestion={suggestion}
          onAccept={handleAcceptSuggestion}
          onDecline={clearSuggestion}
        />
      )}
    </div>
  );
};

export default NestedLayerComposition;
