
import React from 'react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';

interface StratigraphyGraphicalPreviewProps {
  stratigraphy: DatabaseStratigraphy;
  className?: string;
}

const StratigraphyGraphicalPreview = ({ stratigraphy, className = '' }: StratigraphyGraphicalPreviewProps) => {
  const layers = stratigraphy.layers || [];
  const totalThickness = stratigraphy.total_thickness || 100;
  
  if (layers.length === 0) {
    return (
      <div className={`${className} bg-yellow-50 border-2 border-yellow-200 rounded-lg p-1 flex items-center justify-center min-h-[200px]`}>
        <div className="text-center">
          <div className="text-yellow-400 text-4xl mb-3">📋</div>
          <p className="text-yellow-600 font-medium text-sm">Nessun layer disponibile</p>
        </div>
      </div>
    );
  }
  
  // Calcola la scala ottimizzata per lo spazio maggiore disponibile
  const maxWidth = 380;
  const scale = maxWidth / Math.max(totalThickness, 50);
  
  let currentX = 0;
  
  return (
    <div className={`${className} bg-yellow-50 border-2 border-yellow-200 rounded-lg p-1`}>
      <h4 className="text-base font-semibold mb-2 text-gray-800 px-1">Anteprima Stratigrafia</h4>
      <div className="flex items-center justify-center">
        <svg
          width="380"
          height="160"
          viewBox="0 0 380 160"
          className="border border-gray-200 rounded bg-white shadow-sm"
        >
          {/* Linea di riferimento */}
          <line x1="0" y1="80" x2="380" y2="80" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
          
          {layers.map((layer: any, index: number) => {
            const layerWidth = Math.max((layer.thickness || 10) * scale, 12);
            const startX = currentX;
            const color = layer.materials?.color_hex || layer.material?.color_hex || '#CCCCCC';
            
            currentX += layerWidth;
            
            return (
              <g key={`preview-layer-${index}`}>
                {/* Layer principale */}
                <rect
                  x={startX}
                  y="60"
                  width={layerWidth}
                  height="40"
                  fill={color}
                  stroke="#374151"
                  strokeWidth="1"
                  opacity="0.9"
                />
                
                {/* Effetto 3D superiore */}
                <polygon
                  points={`${startX},60 ${startX + 3},57 ${startX + layerWidth + 3},57 ${startX + layerWidth},60`}
                  fill={color}
                  opacity="1"
                  stroke="#374151"
                  strokeWidth="0.5"
                />
                
                {/* Effetto 3D laterale */}
                <polygon
                  points={`${startX + layerWidth},60 ${startX + layerWidth + 3},57 ${startX + layerWidth + 3},97 ${startX + layerWidth},100`}
                  fill={color}
                  opacity="0.7"
                  stroke="#374151"
                  strokeWidth="0.5"
                />
                
                {/* Etichetta spessore solo se c'è spazio */}
                {layerWidth > 30 && (
                  <text
                    x={startX + layerWidth / 2}
                    y="115"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6B7280"
                    fontWeight="600"
                  >
                    {layer.thickness}mm
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Quota totale */}
          <g>
            <line x1="0" y1="135" x2={currentX} y2="135" stroke="#059669" strokeWidth="2" />
            <line x1="0" y1="132" x2="0" y2="138" stroke="#059669" strokeWidth="2" />
            <line x1={currentX} y1="132" x2={currentX} y2="138" stroke="#059669" strokeWidth="2" />
            <text
              x={currentX / 2}
              y="150"
              textAnchor="middle"
              fontSize="12"
              fill="#059669"
              fontWeight="700"
            >
              Totale: {totalThickness}mm
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default StratigraphyGraphicalPreview;
