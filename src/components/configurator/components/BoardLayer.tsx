
import React from 'react';
import { Layer } from '../types/StratigraphyTypes';
import { getLayerActualThickness } from '../utils/stratigraphyUtils';

interface BoardLayerProps {
  layer: Layer;
  index: number;
  renderX: number;
  boardWidth: number;
}

const BoardLayer = ({ layer, index, renderX, boardWidth }: BoardLayerProps) => {
  const color = layer.material?.color_hex || '#D1D5DB';
  const yPosition = 75;
  const height = 80;
  const actualThickness = getLayerActualThickness(layer);
  
  // Label positions
  const centerX = renderX + boardWidth / 2;

  console.log('[BoardLayer] 🟫 RENDERING PROPORTIONAL BOARD:', {
    name: layer.material?.name,
    renderX,
    boardWidth: boardWidth.toFixed(1),
    layerThickness: layer.thickness,
    materialThickness: layer.material?.thickness,
    actualThickness,
    color
  });

  return (
    <g>
      {/* Main board rectangle - rispetta le proporzioni */}
      <rect
        x={renderX}
        y={yPosition}
        width={boardWidth}
        height={height}
        fill={color}
        stroke="#374151"
        strokeWidth="1.5"
        opacity="0.9"
      />
      
      {/* 3D effect - top face proporzionale */}
      <polygon
        points={`${renderX},${yPosition} ${renderX + Math.min(6, boardWidth * 0.1)},${yPosition - 6} ${renderX + boardWidth + Math.min(6, boardWidth * 0.1)},${yPosition - 6} ${renderX + boardWidth},${yPosition}`}
        fill={color}
        opacity="0.95"
        stroke="#374151"
        strokeWidth="1"
      />
      
      {/* 3D effect - right face proporzionale */}
      <polygon
        points={`${renderX + boardWidth},${yPosition} ${renderX + boardWidth + Math.min(6, boardWidth * 0.1)},${yPosition - 6} ${renderX + boardWidth + Math.min(6, boardWidth * 0.1)},${yPosition + height - 6} ${renderX + boardWidth},${yPosition + height}`}
        fill={color}
        opacity="0.7"
        stroke="#374151"
        strokeWidth="1"
      />
      
      {/* Testo solo se la larghezza lo permette */}
      {boardWidth > 30 && (
        <>
          <text
            x={centerX}
            y={yPosition + height / 2 - 8}
            textAnchor="middle"
            fontSize="8"
            fill="#000000"
            fontWeight="600"
          >
            {layer.material?.name?.substring(0, Math.floor(boardWidth / 6)) || 'Lastra'}
          </text>
          
          <text
            x={centerX}
            y={yPosition + height / 2 + 8}
            textAnchor="middle"
            fontSize="7"
            fill="#000000"
            fontWeight="500"
          >
            {actualThickness}mm
          </text>
        </>
      )}
      
      {/* Etichetta spessore verticale sempre visibile */}
      <text
        x={centerX + 15}
        y={118}
        textAnchor="middle"
        fontSize="6"
        fill="#666666"
        fontWeight="400"
        transform={`rotate(-90 ${centerX + 15} 118)`}
      >
        {actualThickness}mm
      </text>
    </g>
  );
};

export default BoardLayer;
