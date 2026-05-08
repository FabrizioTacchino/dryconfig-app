import React, { useEffect, useState } from 'react';
import { GripVertical, X, Copy, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { Layer } from '../types/StratigraphyTypes';
import LayerThicknessInput from './LayerThicknessInput';
import LayerMaterialSelect from './LayerMaterialSelect';
import GroupedMaterialSelect from './GroupedMaterialSelect';
import LayerDetails from './LayerDetails';
import LayerInterAxisInput from './LayerInterAxisInput';
import { useSmartScrewSelection } from '../hooks/useSmartScrewSelection';
import { computeScrewCostPerSqm, getScrewPricePerPiece } from '@/utils/screwPricing';

interface IntegratedBoardLayerItemProps {
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
  onInterAxisChange: (layerId: string, interAxis: number) => void;
  onRemoveLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onScrewChange: (layerId: string, screwMaterialId: string, quantity: number) => void;
  isEditMode?: boolean;
  finishLevel?: string;
  finishLevels?: { finish_level: string; cost_multiplier: number; time_multiplier: number }[];
  // NEW: Props per calcolo intelligente delle viti
  allLayers?: Layer[];
}

const IntegratedBoardLayerItem = ({
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
  onInterAxisChange,
  onRemoveLayer,
  onDuplicateLayer,
  onScrewChange,
  isEditMode = false,
  finishLevel,
  finishLevels,
  allLayers = [],
}: IntegratedBoardLayerItemProps) => {
  const boardMaterials = availableMaterials.filter(m => m.category === 'board');
  
  // Calculate board layers and position
  const boardLayers = allLayers.filter(l => l.material?.category === 'board');
  const totalBoardLayers = boardLayers.length;
  const currentLayerPosition = boardLayers.findIndex(l => l.id === layer.id) + 1;
  // Spessore pacchetto totale dei layer board: somma effettiva (rispetta override
  // dello spessore impostato sul layer, fallback a material.thickness).
  const totalBoardThicknessMm = boardLayers.reduce(
    (sum, l) => sum + (Number(l.thickness) || Number(l.material?.thickness) || 0),
    0,
  );

  console.log('[IntegratedBoardLayerItem] 🏗️ ENHANCED LAYER ANALYSIS:', {
    layerId: layer.id,
    layerName: layer.material?.name,
    layerBoardType: layer.material?.board_type,
    layerMaterialType: layer.material?.material_type,
    layerPosition: layer.position,
    currentLayerPosition,
    totalBoardLayers,
    boardLayersIds: boardLayers.map(l => l.id)
  });

  // Enhanced smart screw selection with dependency on material changes
  const { screwMaterials, suggestedScrew, suggestedQuantity, recommendation } = useSmartScrewSelection({
    boardMaterial: layer.material,
    allMaterials: availableMaterials,
    totalBoardLayers,
    currentLayerPosition,
    currentLayerThicknessMm: Number(layer.thickness) || layer.material?.thickness || undefined,
    totalThicknessMm: totalBoardThicknessMm > 0 ? totalBoardThicknessMm : undefined,
  });

  // Local state for screw quantity management
  const [localScrewQuantity, setLocalScrewQuantity] = useState<string>(
    layer.screwQuantity?.toString() || suggestedQuantity.toString()
  );

  // Update local quantity when suggestion changes
  useEffect(() => {
    if (!layer.screwQuantity) {
      console.log('[IntegratedBoardLayerItem] 📊 UPDATING LOCAL QUANTITY:', {
        layerId: layer.id,
        newSuggestedQuantity: suggestedQuantity,
        previousLocalQuantity: localScrewQuantity
      });
      setLocalScrewQuantity(suggestedQuantity.toString());
    }
  }, [suggestedQuantity, layer.screwQuantity, layer.id, localScrewQuantity]);

  // Enhanced auto-suggest when material or layer count changes
  useEffect(() => {
    if (layer.material && layer.material.category === 'board' && suggestedScrew) {
      // Check if we need to update the screw selection
      const needsUpdate = !layer.screwMaterialId || 
        (layer.screwMaterial && layer.screwMaterial.id !== suggestedScrew.id);
      
      if (needsUpdate) {
        console.log('[IntegratedBoardLayerItem] 🤖 ENHANCED AUTO-SUGGESTING SCREW:', {
          layerId: layer.id,
          boardName: layer.material.name,
          boardType: layer.material.board_type,
          materialType: layer.material.material_type,
          suggestedScrewName: suggestedScrew.name,
          suggestedScrewCode: suggestedScrew.code,
          suggestedQuantity,
          position: currentLayerPosition,
          totalLayers: totalBoardLayers,
          previousScrewId: layer.screwMaterialId,
          reason: !layer.screwMaterialId ? 'No screw assigned' : 'Better screw available'
        });
        
        onScrewChange(layer.id, suggestedScrew.id, suggestedQuantity);
      }
    }
  }, [
    layer.material, 
    layer.material?.id, // Track material ID changes specifically
    layer.material?.board_type, // Track board type changes
    layer.material?.material_type, // Track material type changes
    suggestedScrew, 
    suggestedQuantity, 
    layer.screwMaterialId, 
    onScrewChange, 
    layer.id, 
    currentLayerPosition, 
    totalBoardLayers
  ]);

  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = availableMaterials.find(m => m.id === materialId);
    
    console.log('[IntegratedBoardLayerItem] 📋 ENHANCED MATERIAL CHANGE:', {
      layerId: layer.id,
      newMaterialId: materialId,
      newMaterialName: selectedMaterial?.name,
      newMaterialBoardType: selectedMaterial?.board_type,
      newMaterialType: selectedMaterial?.material_type,
      previousMaterialName: layer.material?.name
    });
    
    onMaterialChange(layer.id, materialId);
  };

  const handleScrewMaterialChange = (screwMaterialId: string) => {
    const quantity = parseInt(localScrewQuantity) || suggestedQuantity;
    console.log('[IntegratedBoardLayerItem] 🔩 SCREW MATERIAL CHANGE:', {
      layerId: layer.id,
      screwMaterialId,
      quantity
    });
    onScrewChange(layer.id, screwMaterialId, quantity);
  };

  const handleScrewQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalScrewQuantity(inputValue);
    
    const quantity = parseInt(inputValue) || 0;
    if (layer.screwMaterialId) {
      console.log('[IntegratedBoardLayerItem] 🔢 SCREW QUANTITY CHANGE:', {
        layerId: layer.id,
        newQuantity: quantity
      });
      onScrewChange(layer.id, layer.screwMaterialId, quantity);
    }
  };

  const containerClasses = `border rounded-lg p-4 bg-white cursor-move transition-all space-y-3
    ${isDragged ? 'opacity-50' : ''}
    ${isDraggedOver ? 'border-construction-primary bg-construction-primary/5' : 'border-gray-200'}
    hover:border-gray-300`;

  const totalLayerCost = (layer.calculatedCostPerSqm || 0) + (layer.screwCostPerSqm || 0);

  console.log('[IntegratedBoardLayerItem] 🏗️ ENHANCED RENDERING:', {
    layerId: layer.id,
    boardMaterial: layer.material?.name,
    boardType: layer.material?.board_type,
    materialType: layer.material?.material_type,
    screwMaterial: layer.screwMaterial?.name,
    screwCode: layer.screwMaterial?.code,
    screwQuantity: layer.screwQuantity,
    suggestedQuantity,
    totalCost: totalLayerCost,
    position: `${currentLayerPosition}/${totalBoardLayers}`,
    suggestedScrewName: suggestedScrew?.name,
    availableCompatibleScrews: screwMaterials.length
  });

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
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">📋 Lastra {currentLayerPosition} (Posiz.{layer.position})</span>
            <span className="text-xs text-gray-500">
              Pos: {currentLayerPosition}/{totalBoardLayers}
            </span>
            {/* Enhanced debug info */}
            {layer.material && (
              <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded">
                {layer.material.board_type || layer.material.material_type || 'N/A'}
              </span>
            )}
          </div>
          
          {/* Material Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Materiale Lastra</label>
            <GroupedMaterialSelect
              material_id={layer.materialId}
              materials={boardMaterials}
              onMaterialChange={handleMaterialChange}
            />
          </div>

          {/* Enhanced Screw Selection with Smart System */}
          {layer.material && layer.material.category === 'board' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Wrench className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Vite</span>
                {suggestedScrew && (
                  <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded font-medium">
                    🎯 Auto: {suggestedScrew.code}
                  </span>
                )}
                <span className="text-[11px] text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                  {recommendation.mappedBoardType.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                  pos {currentLayerPosition}/{totalBoardLayers} · {recommendation.layerPositionRole.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Motivazione tecnica della scelta (regola UNI 11424 / Knauf D11) */}
              <div className="text-xs text-gray-700 bg-white border border-blue-100 rounded px-2 py-1.5">
                <span className="font-medium">📐 Regola: </span>{recommendation.reason}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Tipo Vite</label>
                  <LayerMaterialSelect
                    material_id={layer.screwMaterialId || ''}
                    materials={screwMaterials}
                    onMaterialChange={handleScrewMaterialChange}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Quantità per m² <span className="text-gray-400">(suggerito: {suggestedQuantity})</span>
                  </label>
                  <input
                    type="number"
                    value={localScrewQuantity}
                    onChange={handleScrewQuantityChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                    placeholder={suggestedQuantity.toString()}
                  />
                </div>
              </div>

              {/* Stato compatibilità */}
              {recommendation.candidates.length > 0 && (
                <div className="text-xs text-green-700">
                  ✅ {recommendation.candidates.length} {recommendation.candidates.length === 1 ? 'vite consigliata' : 'viti consigliate'}
                  {recommendation.byBoardType.length > recommendation.candidates.length && (
                    <span className="text-gray-500"> · {recommendation.byBoardType.length - recommendation.candidates.length} compatibili ma più corte</span>
                  )}
                  {layer.screwMaterial && (() => {
                    const pricePerPiece = getScrewPricePerPiece(layer.screwMaterial);
                    const costPerSqm = computeScrewCostPerSqm(layer.screwMaterial, layer.screwQuantity || 0);
                    return (
                      <span className="ml-2">
                        • €{pricePerPiece.toFixed(4)}/pz × {layer.screwQuantity || 0} = <strong>€{costPerSqm.toFixed(3)}/m²</strong>
                      </span>
                    );
                  })()}
                </div>
              )}

              {recommendation.candidates.length === 0 && recommendation.byBoardType.length > 0 && (
                <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded">
                  ⚠️ Nessuna vite di lunghezza ≥ {recommendation.requiredLength.toFixed(0)} mm tra quelle compatibili. Mostrate {recommendation.byBoardType.length} viti compatibili più corte — verifica manualmente.
                </div>
              )}

              {recommendation.byBoardType.length === 0 && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded">
                  ⚠️ Nessuna vite compatibile con <strong>{recommendation.mappedBoardType.replace(/_/g, ' ')}</strong> nel catalogo. Importa un listino o aggiungi viti dal pannello materiali.
                </div>
              )}
            </div>
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
            onChange={interAxis => onInterAxisChange(layer.id, interAxis)}
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

export default IntegratedBoardLayerItem;
