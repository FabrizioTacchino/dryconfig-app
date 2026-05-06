
import React from 'react';
import { Layer } from '../types/StratigraphyTypes';
import { identifyStructuralGroups, isBoard, isInsulation, isGuide, getLayerActualThickness } from '../utils/stratigraphyUtils';
import InsulationLayer from './InsulationLayer';
import BoardLayer from './BoardLayer';
import StructuralGroupRenderer from './StructuralGroupRenderer';

interface LayerRendererProps {
  layers: Layer[];
  scale: number;
  startX?: number;
}

const LayerRenderer = ({ layers, scale, startX = 50 }: LayerRendererProps) => {
  const structuralGroups = identifyStructuralGroups(layers);
  
  let currentX = startX;
  
  console.log('[LayerRenderer] 🔍 RENDERING WITH PRECISE POSITIONING:', {
    totalGroups: structuralGroups.length,
    scale: scale.toFixed(2),
    startX,
    groups: structuralGroups.map(g => ({
      type: g.type,
      layersCount: g.layers.length,
      totalThickness: g.totalThickness
    }))
  });
  
  return (
    <>
      {structuralGroups.map((group, groupIndex) => {
        const groupStartX = currentX;
        
        console.log('[LayerRenderer] 🎯 RENDERING GROUP:', {
          groupIndex,
          type: group.type,
          startX: groupStartX,
          layersCount: group.layers.length
        });
        
        if (group.type === 'structural') {
          // Render structural group
          const structureThickness = group.structure ? getLayerActualThickness(group.structure) : 10;
          const groupWidth = structureThickness * scale;
          const groupElement = (
            <StructuralGroupRenderer
              key={group.id}
              group={group}
              startX={groupStartX}
              groupWidth={groupWidth}
              scale={scale}
            />
          );
          
          // Avanza la posizione: larghezza gruppo + spaziatura tra gruppi
          currentX += groupWidth;
          if (groupIndex < structuralGroups.length - 1) {
            currentX += 8; // Spaziatura tra gruppi solo se non è l'ultimo
          }
          
          console.log('[LayerRenderer] 🏗️ STRUCTURAL GROUP POSITIONED:', {
            groupStartX,
            groupWidth: groupWidth.toFixed(1),
            nextX: currentX.toFixed(1)
          });
          
          return groupElement;
        } else {
          // Render standalone layers
          const groupElements: React.ReactElement[] = [];
          const nonGuideLayers = group.layers.filter(layer => !isGuide(layer.material));
          
          nonGuideLayers.forEach((layer, layerIndex) => {
            const actualThickness = getLayerActualThickness(layer);
            const layerWidth = actualThickness * scale;
            const layerStartX = currentX;
            
            console.log('[LayerRenderer] 📏 STANDALONE LAYER POSITIONED:', {
              layerId: layer.id,
              materialName: layer.material?.name,
              actualThickness,
              layerWidth: layerWidth.toFixed(1),
              startX: layerStartX.toFixed(1)
            });
            
            if (isBoard(layer.material)) {
              groupElements.push(
                <BoardLayer
                  key={`${group.id}-board-${layer.id}`}
                  layer={layer}
                  index={group.startPosition + layerIndex}
                  renderX={layerStartX}
                  boardWidth={layerWidth}
                />
              );
            } else if (isInsulation(layer.material)) {
              groupElements.push(
                <InsulationLayer
                  key={`${group.id}-insulation-${layer.id}`}
                  layer={layer}
                  index={group.startPosition + layerIndex}
                  renderX={layerStartX}
                  insulationWidth={layerWidth}
                  isInternal={false}
                />
              );
            } else {
              // Altri materiali
              groupElements.push(
                <g key={`${group.id}-other-${layer.id}`}>
                  <rect
                    x={layerStartX}
                    y={75}
                    width={layerWidth}
                    height={70}
                    fill={layer.material?.color_hex || '#CCCCCC'}
                    stroke="#374151"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                  {layerWidth > 20 && (
                    <>
                      <text
                        x={layerStartX + layerWidth / 2}
                        y={105}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#000000"
                        fontWeight="500"
                      >
                        {layer.material?.name?.substring(0, Math.floor(layerWidth / 8)) || 'Altro'}
                      </text>
                      <text
                        x={layerStartX + layerWidth / 2}
                        y={120}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#666666"
                        fontWeight="400"
                      >
                        {actualThickness}mm
                      </text>
                    </>
                  )}
                </g>
              );
            }
            
            // Avanza la posizione: larghezza layer + spaziatura tra layer
            currentX += layerWidth;
            if (layerIndex < nonGuideLayers.length - 1) {
              currentX += 4; // Spaziatura tra layer standalone solo se non è l'ultimo
            }
          });
          
          // Aggiungi spaziatura tra gruppi dopo aver completato il gruppo standalone
          if (groupIndex < structuralGroups.length - 1 && nonGuideLayers.length > 0) {
            currentX += 8;
          }
          
          console.log('[LayerRenderer] 🔗 STANDALONE GROUP COMPLETED:', {
            layersCount: nonGuideLayers.length,
            finalX: currentX.toFixed(1)
          });
          
          return <g key={group.id}>{groupElements}</g>;
        }
      })}
    </>
  );
};

export default LayerRenderer;
