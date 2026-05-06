
import React from 'react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { Badge } from '@/components/ui/badge';

interface DetailedStratigraphyPreviewProps {
  stratigraphy: DatabaseStratigraphy;
  className?: string;
}

const DetailedStratigraphyPreview = ({ stratigraphy, className = '' }: DetailedStratigraphyPreviewProps) => {
  // Parse dei layer dalla stratigraphy
  const layers = stratigraphy.layers || [];
  const totalThickness = stratigraphy.total_thickness || 100;
  
  // Se non ci sono layer, mostra un placeholder
  if (layers.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="w-full h-[200px] border border-gray-200 rounded bg-gray-50 flex items-center justify-center">
          <span className="text-sm text-gray-400">Nessun layer disponibile</span>
        </div>
      </div>
    );
  }
  
  // Calcola la scala per la preview
  const maxWidth = 300;
  const scale = maxWidth / Math.max(totalThickness, 50);
  
  let currentX = 0;
  
  return (
    <div className={`${className} space-y-4`}>
      {/* SVG Preview più grande */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-3 text-gray-700">Anteprima Stratigrafia</h4>
        <svg
          width="300"
          height="120"
          viewBox="0 0 300 120"
          className="border border-gray-100 rounded bg-gray-50"
        >
          {/* Linea di riferimento */}
          <line x1="0" y1="60" x2="300" y2="60" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
          
          {layers.map((layer: any, index: number) => {
            const layerWidth = Math.max((layer.thickness || 10) * scale, 8); // Minimo 8px di larghezza
            const startX = currentX;
            const color = layer.materials?.color_hex || layer.material?.color_hex || '#CCCCCC';
            
            currentX += layerWidth;
            
            return (
              <g key={`preview-layer-${index}`}>
                {/* Layer principale */}
                <rect
                  x={startX}
                  y="40"
                  width={layerWidth}
                  height="40"
                  fill={color}
                  stroke="#374151"
                  strokeWidth="1"
                  opacity="0.9"
                />
                
                {/* Effetto 3D */}
                <polygon
                  points={`${startX},40 ${startX + 3},37 ${startX + layerWidth + 3},37 ${startX + layerWidth},40`}
                  fill={color}
                  opacity="1"
                  stroke="#374151"
                  strokeWidth="0.5"
                />
                
                <polygon
                  points={`${startX + layerWidth},40 ${startX + layerWidth + 3},37 ${startX + layerWidth + 3},77 ${startX + layerWidth},80`}
                  fill={color}
                  opacity="0.7"
                  stroke="#374151"
                  strokeWidth="0.5"
                />
                
                {/* Etichetta spessore se c'è spazio */}
                {layerWidth > 25 && (
                  <text
                    x={startX + layerWidth / 2}
                    y="95"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6B7280"
                    fontWeight="500"
                  >
                    {layer.thickness}mm
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Quota totale */}
          <g>
            <line x1="0" y1="105" x2={currentX} y2="105" stroke="#059669" strokeWidth="2" />
            <line x1="0" y1="100" x2="0" y2="110" stroke="#059669" strokeWidth="2" />
            <line x1={currentX} y1="100" x2={currentX} y2="110" stroke="#059669" strokeWidth="2" />
            <text
              x={currentX / 2}
              y="118"
              textAnchor="middle"
              fontSize="11"
              fill="#059669"
              fontWeight="600"
            >
              Totale: {totalThickness}mm
            </text>
          </g>
        </svg>
      </div>

      {/* Elenco materiali */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-3 text-gray-700">Materiali utilizzati</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {layers.map((layer: any, index: number) => {
            const material = layer.materials || layer.material;
            const color = material?.color_hex || '#CCCCCC';
            
            return (
              <div key={`material-${index}`} className="flex items-center gap-3 text-xs">
                <div
                  className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {material?.name || 'Materiale non specificato'}
                  </div>
                  {material?.category && (
                    <div className="text-gray-500 capitalize">
                      {material.category}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                  {layer.thickness}mm
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DetailedStratigraphyPreview;
