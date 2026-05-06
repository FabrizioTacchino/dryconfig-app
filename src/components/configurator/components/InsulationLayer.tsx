
import React from 'react';
import { Layer } from '../types/StratigraphyTypes';

interface InsulationLayerProps {
  layer: Layer;
  index: number;
  renderX: number;
  insulationWidth: number;
  isInternal?: boolean;
}

const InsulationLayer = ({ layer, index, renderX, insulationWidth, isInternal = false }: InsulationLayerProps) => {
  const color = layer.material?.color_hex || '#CCCCCC';
  
  // Adjust Y position for internal vs external insulation
  const yPosition = isInternal ? 85 : 85;
  const height = isInternal ? 60 : 60;
  
  // Label positions - horizontal for internal, vertical for external
  const centerX = renderX + insulationWidth / 2;

  return (
    <g>
      {/* Pattern definition for insulation */}
      <defs>
        <pattern
          id={`insulation-pattern-${layer.id}-${index}-${isInternal ? 'internal' : 'external'}`}
          patternUnits="userSpaceOnUse"
          width="4"
          height="4"
        >
          <rect width="4" height="4" fill={color} opacity="0.3" />
          <circle cx="2" cy="2" r="1" fill={color} opacity="0.8" />
        </pattern>
      </defs>

      {/* Rendering isolante with pattern */}
      <rect
        x={renderX}
        y={yPosition}
        width={insulationWidth}
        height={height}
        fill={`url(#insulation-pattern-${layer.id}-${index}-${isInternal ? 'internal' : 'external'})`}
        stroke={color}
        strokeWidth="1"
        opacity="0.9"
      />
      
      {/* 3D effect for insulation */}
      <polygon
        points={`${renderX},${yPosition} ${renderX + 6},${yPosition - 6} ${renderX + insulationWidth + 6},${yPosition - 6} ${renderX + insulationWidth},${yPosition}`}
        fill={color}
        opacity="0.7"
        stroke="#374151"
        strokeWidth="1"
      />
      
      <polygon
        points={`${renderX + insulationWidth},${yPosition} ${renderX + insulationWidth + 6},${yPosition - 6} ${renderX + insulationWidth + 6},${yPosition + height - 6} ${renderX + insulationWidth},${yPosition + height}`}
        fill={color}
        opacity="0.5"
        stroke="#374151"
        strokeWidth="1"
      />
      
      {/* Labels for insulation */}
      {isInternal ? (
        // Horizontal labels for internal insulation
        <>
          {/* Material name - horizontal positioned on the insulation (lowered by additional 3px) */}
          <text
            x={centerX}
            y={yPosition - 1}
            textAnchor="middle"
            fontSize="7"
            fill="#000000"
            fontWeight="600"
          >
            {layer.material?.name?.split(' ')[0] || 'Isolante'} (INT)
          </text>
          
          {/* Thickness - horizontal below the insulation (raised by 15px) */}
          <text
            x={centerX}
            y={yPosition + height}
            textAnchor="middle"
            fontSize="6"
            fill="#000000"
            fontWeight="500"
          >
            {layer.thickness}mm
          </text>
        </>
      ) : (
        // Vertical labels for external insulation
        <>
          <text
            x={centerX - 8}
            y={118}
            textAnchor="middle"
            fontSize="7"
            fill="#000000"
            fontWeight="600"
            transform={`rotate(-90 ${centerX - 8} 118)`}
          >
            {layer.material?.name?.split(' ')[0] || 'Isolante'}
          </text>
          
          <text
            x={centerX + 8}
            y={118}
            textAnchor="middle"
            fontSize="6"
            fill="#000000"
            fontWeight="500"
            transform={`rotate(-90 ${centerX + 8} 118)`}
          >
            {layer.thickness}mm
          </text>
        </>
      )}
    </g>
  );
};

export default InsulationLayer;
