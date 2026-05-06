
import React from 'react';
import { Layer } from '../types/StratigraphyTypes';

interface LayerLabelsProps {
  layer: Layer;
  renderX: number;
  layerWidth: number;
}

const LayerLabels = ({ layer, renderX, layerWidth }: LayerLabelsProps) => {
  return (
    <g>
      {/* Etichetta spessore verticale - centrata nel layer */}
      <text
        x={renderX + layerWidth / 2}
        y="125"
        textAnchor="middle"
        fontSize="9"
        fill="#374151"
        fontWeight="600"
        transform={`rotate(-90 ${renderX + layerWidth / 2} 125)`}
      >
        {layer.thickness}mm
      </text>
      
      {/* Nome materiale verticale - leggermente spostato */}
      <text
        x={renderX + layerWidth / 2 + 12}
        y="125"
        textAnchor="middle"
        fontSize="7"
        fill="#6B7280"
        fontWeight="400"
        transform={`rotate(-90 ${renderX + layerWidth / 2 + 12} 125)`}
      >
        {layer.material?.name?.substring(0, 12) || 'Materiale'}
      </text>
    </g>
  );
};

export default LayerLabels;
