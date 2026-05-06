
import React from 'react';
import { Layer } from '../types/StratigraphyTypes';
import LayerRenderer from './LayerRenderer';
import SVGDefinitions from './SVGDefinitions';
import { calculateActualThickness, identifyStructuralGroups, isGuide, isAccessory, getLayerActualThickness } from '../utils/stratigraphyUtils';

interface StratigraphySVGProps {
  layers: Layer[];
  actualTotalThickness: number;
}

const StratigraphySVG = ({ layers, actualTotalThickness }: StratigraphySVGProps) => {
  const correctedTotalThickness = calculateActualThickness(layers);
  const structuralGroups = identifyStructuralGroups(layers);
  
  // Calcola la larghezza effettiva del disegno considerando le spaziature reali
  // ESCLUDENDO gli accessori dalla visualizzazione
  const calculateEffectiveDrawingWidth = (scale: number) => {
    let totalWidth = 0;
    let groupCount = 0;
    
    structuralGroups.forEach((group) => {
      if (group.type === 'structural') {
        // Gruppo strutturale
        const structureThickness = group.structure ? getLayerActualThickness(group.structure) : 10;
        totalWidth += structureThickness * scale;
        groupCount++;
      } else {
        // Layer standalone - ESCLUDI GUIDE E ACCESSORI dalla visualizzazione
        const visibleLayers = group.layers.filter(layer => !isGuide(layer.material) && !isAccessory(layer.material));
        
        visibleLayers.forEach((layer) => {
          const actualThickness = getLayerActualThickness(layer);
          totalWidth += actualThickness * scale;
        });
        
        // Aggiungi spaziature tra layer standalone visibili (4px ciascuna)
        if (visibleLayers.length > 0) {
          totalWidth += (visibleLayers.length - 1) * 4;
          groupCount++;
        }
      }
    });
    
    // Aggiungi spaziature tra gruppi (8px ciascuna)
    if (groupCount > 1) {
      totalWidth += (groupCount - 1) * 8;
    }
    
    return totalWidth;
  };
  
  // Sistema di scaling adattivo
  const baseWidth = Math.max(correctedTotalThickness, 100);
  const scale = Math.min(8, Math.max(0.8, 320 / baseWidth));
  
  // Calcola la larghezza effettiva del disegno (incluse spaziature, esclusi accessori)
  const effectiveDrawingWidth = calculateEffectiveDrawingWidth(scale);
  
  // SVG dinamico che si adatta al contenuto + margini
  const svgWidth = Math.max(400, effectiveDrawingWidth + 120);
  const svgHeight = 200;
  
  // Posizione di partenza centrata
  const startX = (svgWidth - effectiveDrawingWidth) / 2;

  console.log('[StratigraphySVG] 🎨 PRECISE DRAWING WIDTH CALCULATION (excluding accessories):', {
    layersCount: layers.length,
    accessoryLayers: layers.filter(l => isAccessory(l.material)).length,
    correctedTotalThickness,
    baseWidth,
    scale: scale.toFixed(2),
    effectiveDrawingWidth: effectiveDrawingWidth.toFixed(1),
    svgWidth,
    startX: startX.toFixed(1),
    groupsCount: structuralGroups.length
  });

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="border rounded bg-white">
        <SVGDefinitions layers={layers} />
        
        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill="#f8f9fa" />
        
        {/* Rendering dei layer con posizione centrata - ESCLUSI GLI ACCESSORI */}
        <LayerRenderer
          layers={layers.filter(layer => !isAccessory(layer.material))}
          scale={scale}
          startX={startX}
        />
        
        {/* Linea di quotatura totale - allineata perfettamente al disegno effettivo */}
        <g>
          <line x1={startX} y1="30" x2={startX + effectiveDrawingWidth} y2="30" stroke="#666" strokeWidth="1" />
          <line x1={startX} y1="25" x2={startX} y2="35" stroke="#666" strokeWidth="1" />
          <line x1={startX + effectiveDrawingWidth} y1="25" x2={startX + effectiveDrawingWidth} y2="35" stroke="#666" strokeWidth="1" />
          <text
            x={startX + effectiveDrawingWidth / 2}
            y="20"
            textAnchor="middle"
            fontSize="12"
            fill="#333"
            fontWeight="600"
          >
            {correctedTotalThickness.toFixed(1)} mm
          </text>
        </g>
        
        {/* Debug info */}
        <text
          x="10"
          y={svgHeight - 10}
          fontSize="8"
          fill="#999"
        >
          Scala: {scale.toFixed(2)}x | Larghezza: {effectiveDrawingWidth.toFixed(1)}px (no accessories)
        </text>
      </svg>
    </div>
  );
};

export default StratigraphySVG;
