
import React from 'react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { identifyStructuralGroups } from '@/components/configurator/utils/stratigraphyUtils';

interface MiniStratigraphyPreviewProps {
  stratigraphy: DatabaseStratigraphy | any;
  className?: string;
}

const MiniStratigraphyPreview = ({ stratigraphy, className = '' }: MiniStratigraphyPreviewProps) => {
  if (!stratigraphy) {
    return (
      <div className={`${className} bg-gray-50 border border-gray-200 rounded flex items-center justify-center`}>
        <span className="text-xs text-gray-400">N/A</span>
      </div>
    );
  }

  const layers = stratigraphy.layers || [];
  const totalThickness = stratigraphy.total_thickness || 100;
  
  if (layers.length === 0) {
    return (
      <div className={`${className} bg-gray-50 border border-gray-200 rounded flex items-center justify-center`}>
        <span className="text-xs text-gray-400">Nessun layer</span>
      </div>
    );
  }
  
  const structuralGroups = identifyStructuralGroups(layers);
  
  // Calculate scale for mini container
  const maxWidth = 60;
  const scale = maxWidth / Math.max(totalThickness, 50);
  
  let currentX = 0;
  
  return (
    <div className={`${className} bg-white border border-gray-200 rounded overflow-hidden`}>
      <svg
        width="60"
        height="48"
        viewBox="0 0 60 48"
        className="w-full h-full"
      >
        {/* Reference line */}
        <line x1="0" y1="24" x2="60" y2="24" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
        
        {structuralGroups.map((group, groupIndex) => {
          const startX = currentX;
          
          if (group.type === 'structural' && group.structure) {
            // Render structural group
            const groupWidth = Math.max((group.structure.thickness || 10) * scale, 2);
            const color = group.structure.material?.color_hex || '#CCCCCC';
            const hasGuides = group.guides.length > 0;
            const hasInternalInsulation = group.internalInsulation.length > 0;
            
            currentX += groupWidth;
            
            return (
              <g key={`mini-group-${groupIndex}`}>
                {/* Main structure */}
                <rect
                  x={startX}
                  y="18"
                  width={groupWidth}
                  height="12"
                  fill={color}
                  stroke="#374151"
                  strokeWidth="0.5"
                  opacity="0.9"
                />
                
                {/* 3D effect top */}
                <polygon
                  points={`${startX},18 ${startX + 1.5},16.5 ${startX + groupWidth + 1.5},16.5 ${startX + groupWidth},18`}
                  fill={color}
                  opacity="1"
                  stroke="#374151"
                  strokeWidth="0.3"
                />
                
                {/* 3D effect side */}
                <polygon
                  points={`${startX + groupWidth},18 ${startX + groupWidth + 1.5},16.5 ${startX + groupWidth + 1.5},28.5 ${startX + groupWidth},30`}
                  fill={color}
                  opacity="0.7"
                  stroke="#374151"
                  strokeWidth="0.3"
                />
                
                {/* Render guides */}
                {hasGuides && (
                  <>
                    {/* Upper guide */}
                    <rect
                      x={startX - 1}
                      y="14"
                      width={groupWidth + 2}
                      height="2"
                      fill="#8B5CF6"
                      stroke="#6D28D9"
                      strokeWidth="0.3"
                      opacity="0.8"
                    />
                    
                    {/* Lower guide */}
                    <rect
                      x={startX - 1}
                      y="32"
                      width={groupWidth + 2}
                      height="2"
                      fill="#8B5CF6"
                      stroke="#6D28D9"
                      strokeWidth="0.3"
                      opacity="0.8"
                    />
                  </>
                )}
                
                {/* Render internal insulation indicator */}
                {hasInternalInsulation && (
                  <rect
                    x={startX + groupWidth * 0.2}
                    y="20"
                    width={groupWidth * 0.6}
                    height="8"
                    fill="#FFD700"
                    stroke="#FFA500"
                    strokeWidth="0.2"
                    opacity="0.7"
                  />
                )}
              </g>
            );
          } else {
            // Render standalone layers
            const groupElements: React.ReactElement[] = [];
            
            group.layers.forEach((layer: any, layerIndex: number) => {
              const layerWidth = Math.max((layer.thickness || 10) * scale, 2);
              const layerStartX = currentX;
              const color = layer.materials?.color_hex || layer.material?.color_hex || '#CCCCCC';
              
              groupElements.push(
                <g key={`mini-standalone-${layer.id}`}>
                  <rect
                    x={layerStartX}
                    y="18"
                    width={layerWidth}
                    height="12"
                    fill={color}
                    stroke="#374151"
                    strokeWidth="0.5"
                    opacity="0.9"
                  />
                  
                  <polygon
                    points={`${layerStartX},18 ${layerStartX + 1.5},16.5 ${layerStartX + layerWidth + 1.5},16.5 ${layerStartX + layerWidth},18`}
                    fill={color}
                    opacity="1"
                    stroke="#374151"
                    strokeWidth="0.3"
                  />
                  
                  <polygon
                    points={`${layerStartX + layerWidth},18 ${layerStartX + layerWidth + 1.5},16.5 ${layerStartX + layerWidth + 1.5},28.5 ${layerStartX + layerWidth},30`}
                    fill={color}
                    opacity="0.7"
                    stroke="#374151"
                    strokeWidth="0.3"
                  />
                </g>
              );
              
              currentX += layerWidth;
            });
            
            return <g key={`mini-standalone-group-${groupIndex}`}>{groupElements}</g>;
          }
        })}
        
        {/* Total thickness label */}
        {currentX < 55 && (
          <text
            x={currentX / 2}
            y="42"
            textAnchor="middle"
            fontSize="6"
            fill="#6B7280"
            fontWeight="600"
          >
            {totalThickness}mm
          </text>
        )}
      </svg>
    </div>
  );
};

export default MiniStratigraphyPreview;
