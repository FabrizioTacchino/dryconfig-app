
import React from 'react';
import { Layer } from '../types/StratigraphyTypes';
import { isInsulation } from '../utils/stratigraphyUtils';

interface SVGDefinitionsProps {
  layers: Layer[];
}

const SVGDefinitions = ({ layers }: SVGDefinitionsProps) => {
  const sortedLayers = [...layers].sort((a, b) => a.position - b.position);

  return (
    <defs>
      {sortedLayers.filter(layer => isInsulation(layer.material)).map((layer, index) => {
        const insulationColor = layer.material?.color_hex || '#FFFF99';
        const insulationPattern = `insulation-pattern-${layer.id}-${index}`;
        
        return (
          <pattern 
            key={insulationPattern}
            id={insulationPattern} 
            x="0" 
            y="0" 
            width="6" 
            height="6" 
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill={insulationColor} opacity="0.4"/>
            <path d="M0,6 L6,0 M-1,1 L1,-1 M5,7 L7,5" stroke={insulationColor} strokeWidth="0.8" opacity="0.9"/>
            <circle cx="3" cy="3" r="1" fill={insulationColor} opacity="0.6"/>
          </pattern>
        );
      })}
    </defs>
  );
};

export default SVGDefinitions;
