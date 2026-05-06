import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types';
import { Layer } from '../types/StratigraphyTypes';
import LayerItem from './LayerItem';
import EmptyLayerState from './EmptyLayerState';
import TotalThicknessQuote from './TotalThicknessQuote';
import StratigraphyPreview from '../StratigraphyPreview';
import { useAutoSuggestStructure } from '../hooks/useAutoSuggestStructure';
import StructureSuggestionDialog from './StructureSuggestionDialog';

interface UnifiedStratigraphyCompositionProps {
  layers: Layer[];
  onLayersChange: (layers: Layer[]) => void;
  onAddLayer: () => void;
  totalThickness: number;
  availableMaterials: DatabaseMaterial[];
  showLayerCosts?: boolean;
  advancedBreakdown?: any;
  onScrewsChange?: (layerId: string, customScrews?: { screwId: string; quantity: number }) => void;
  isEditMode?: boolean;
  showPreview?: boolean;
}

const UnifiedStratigraphyComposition = ({
  layers,
  onLayersChange,
  onAddLayer,
  totalThickness,
  availableMaterials,
  showLayerCosts = false,
  advancedBreakdown,
  onScrewsChange,
  isEditMode = false,
  showPreview = true
}: UnifiedStratigraphyCompositionProps) => {
  console.log('[UnifiedStratigraphyComposition] 🔩 INTEGRATED SYSTEM:', {
    layersCount: layers.length,
    layersWithScrews: layers.filter(l => l.screwMaterialId).length,
    isEditMode,
    showPreview
  });

  const {
    suggestion,
    checkForSuggestion,
    clearSuggestion
  } = useAutoSuggestStructure();

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    e.dataTransfer.setData('layerId', layerId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    const layerId = e.dataTransfer.getData('layerId');
    if (!layerId) return;

    const draggedIndex = layers.findIndex(layer => layer.id === layerId);
    if (draggedIndex === -1) return;

    const reorderedLayers = [...layers];
    const [draggedLayer] = reorderedLayers.splice(draggedIndex, 1);
    reorderedLayers.splice(dropIndex, 0, draggedLayer);

    const updatedLayers = reorderedLayers.map((layer, index) => ({
      ...layer,
      position: index + 1
    }));

    onLayersChange(updatedLayers);
  };

  const handleDragLeave = () => {};

  const handleThicknessChange = (layerId: string, thickness: number) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, thickness } : layer
    );
    onLayersChange(updatedLayers);
  };

  const handleMaterialChange = (layerId: string, materialId: string) => {
    const selectedMaterial = availableMaterials.find(m => m.id === materialId);
    
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          materialId,
          material: selectedMaterial
        };
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
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, interAxis } : layer
    );
    onLayersChange(updatedLayers);
  };

  const handleRemoveLayer = (layerId: string) => {
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    onLayersChange(updatedLayers);
  };

  const handleDuplicateLayer = (layerId: string) => {
    const layerToDuplicate = layers.find(layer => layer.id === layerId);
    if (layerToDuplicate) {
      const newLayer = {
        ...layerToDuplicate,
        id: `layer-${Date.now()}-${Math.random()}`,
        position: layers.length + 1
      };
      onLayersChange([...layers, newLayer]);
    }
  };

  const handleCostChange = (layerId: string, cost: number) => {
    console.log('[UnifiedStratigraphyComposition] 💰 COST CHANGE per layer:', layerId, { cost });
    
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          calculatedCostPerSqm: cost
        };
      }
      return layer;
    });
    
    onLayersChange(updatedLayers);
  };

  const handleAutoSuggestCheck = (selectedMaterial: DatabaseMaterial, layerId: string) => {
    console.log('[UnifiedStratigraphyComposition] 🏗️ AUTO-SUGGEST CHECK:', selectedMaterial.category);
    
    const currentLayer = layers.find(l => l.id === layerId);
    if (!currentLayer) return;
    
    checkForSuggestion(
      selectedMaterial,
      availableMaterials,
      currentLayer,
      layers
    );
  };

  const handleAcceptSuggestion = () => {
    if (!suggestion) return;
    
    console.log('[UnifiedStratigraphyComposition] ✅ ACCETTAZIONE SUGGERIMENTO:', suggestion.type);
    
    const newLayer = {
      id: `layer-${Date.now()}-${Math.random()}`,
      materialId: suggestion.suggestedMaterial.id,
      material: suggestion.suggestedMaterial,
      thickness: suggestion.suggestedMaterial.thickness || 48,
      position: layers.length + 1,
      category: suggestion.suggestedMaterial.category as MaterialCategory,
      interAxis: suggestion.suggestedMaterial.category === 'structure_guide' ? undefined : 600
    };
    
    onLayersChange([...layers, newLayer]);
    clearSuggestion();
  };

  const CompositionCard = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Composizione Stratigrafica</CardTitle>
        <Button 
          onClick={onAddLayer} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Aggiungi Layer
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {layers.length === 0 ? (
          <EmptyLayerState />
        ) : (
          <div className="space-y-3">
            {layers.map((layer, index) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                index={index}
                availableMaterials={availableMaterials}
                isDragged={false}
                isDraggedOver={false}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onThicknessChange={handleThicknessChange}
                onMaterialChange={handleMaterialChange}
                onCategoryChange={handleCategoryChange}
                onInterAxisChange={handleInterAxisChange}
                onRemoveLayer={handleRemoveLayer}
                onDuplicateLayer={handleDuplicateLayer}
                onCostChange={handleCostChange}
                onAutoSuggestCheck={handleAutoSuggestCheck}
                isEditMode={isEditMode}
              />
            ))}
          </div>
        )}
        
        {layers.length > 0 && (
          <TotalThicknessQuote totalThickness={totalThickness} scale={1} />
        )}
      </CardContent>
    </Card>
  );

  if (!showPreview) {
    return (
      <>
        <div className="space-y-6">
          {CompositionCard}
        </div>

        <StructureSuggestionDialog
          suggestion={suggestion}
          onAccept={handleAcceptSuggestion}
          onDecline={clearSuggestion}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-6">
          {CompositionCard}
        </div>

        <div className="space-y-6">
          <StratigraphyPreview 
            layers={layers}
            totalThickness={totalThickness}
            showLayerCosts={showLayerCosts}
            advancedBreakdown={advancedBreakdown}
          />
        </div>
      </div>

      <StructureSuggestionDialog
        suggestion={suggestion}
        onAccept={handleAcceptSuggestion}
        onDecline={clearSuggestion}
      />
    </>
  );
};

export default UnifiedStratigraphyComposition;
