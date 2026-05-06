
import React from 'react';
import { Layer } from '../types/StratigraphyTypes';

interface StructureLayerProps {
  layer: Layer;
  renderX: number;
  layerWidth: number;
  associatedGuides: Layer[];
}

const StructureLayer = ({ layer, renderX, layerWidth, associatedGuides }: StructureLayerProps) => {
  const color = layer.material?.color_hex || '#CCCCCC';
  const hasGuides = associatedGuides.length > 0;

  return (
    <g>
      {/* Rendering guide superiore */}
      {hasGuides && (
        <rect
          x={renderX - 5}
          y="55"
          width={layerWidth + 10}
          height="8"
          fill="#8B5CF6"
          stroke="#6D28D9"
          strokeWidth="1"
          opacity="0.9"
        />
      )}

      {/* Rendering materiale strutturale */}
      <rect
        x={renderX}
        y="75"
        width={layerWidth}
        height="80"
        fill={color}
        stroke="#374151"
        strokeWidth="1"
        opacity="0.8"
      />
      
      {/* Effetto 3D - lato superiore */}
      <polygon
        points={`${renderX},75 ${renderX + 8},67 ${renderX + layerWidth + 8},67 ${renderX + layerWidth},75`}
        fill={color}
        opacity="0.9"
        stroke="#374151"
        strokeWidth="1"
      />
      
      {/* Effetto 3D - lato destro */}
      <polygon
        points={`${renderX + layerWidth},75 ${renderX + layerWidth + 8},67 ${renderX + layerWidth + 8},147 ${renderX + layerWidth},155`}
        fill={color}
        opacity="0.6"
        stroke="#374151"
        strokeWidth="1"
      />

      {/* Rendering guida inferiore */}
      {hasGuides && (
        <rect
          x={renderX - 5}
          y="159"
          width={layerWidth + 10}
          height="8"
          fill="#8B5CF6"
          stroke="#6D28D9"
          strokeWidth="1"
          opacity="0.9"
        />
      )}
      
      {/* Testo orizzontale sulla struttura - nome materiale */}
      <text
        x={renderX + layerWidth / 2}
        y="108"
        textAnchor="middle"
        fontSize="8"
        fill="#000000"
        fontWeight="600"
      >
        {layer.material?.name?.substring(0, 10) || 'Struttura'}
      </text>
      
      {/* Spessore orizzontale sulla struttura */}
      <text
        x={renderX + layerWidth / 2}
        y="128"
        textAnchor="middle"
        fontSize="7"
        fill="#000000"
        fontWeight="500"
      >
        {layer.thickness}mm
      </text>
      
      {/* Etichette guide */}
      {hasGuides && (
        <>
          <text
            x={renderX + layerWidth / 2}
            y="61"
            textAnchor="middle"
            fontSize="6"
            fill="#6D28D9"
            fontWeight="600"
          >
            GUIDA
          </text>
          
          <text
            x={renderX + layerWidth / 2}
            y="165"
            textAnchor="middle"
            fontSize="6"
            fill="#6D28D9"
            fontWeight="600"
          >
            GUIDA
          </text>
        </>
      )}
    </g>
  );
};

export default StructureLayer;
