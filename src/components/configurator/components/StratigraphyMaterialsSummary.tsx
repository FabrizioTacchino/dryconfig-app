
import React from 'react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StratigraphyMaterialsSummaryProps {
  stratigraphy: DatabaseStratigraphy;
  className?: string;
}

const StratigraphyMaterialsSummary = ({ stratigraphy, className = '' }: StratigraphyMaterialsSummaryProps) => {
  const layers = stratigraphy.layers || [];
  
  return (
    <div className={`${className} space-y-2 h-full`}>
      {/* Elenco materiali compatto */}
      <Card className="text-xs h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold">Materiali Utilizzati</CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex-1 flex flex-col">
          <div className="space-y-1 flex-1">
            {layers.map((layer: any, index: number) => {
              const material = layer.materials || layer.material;
              const color = material?.color_hex || '#CCCCCC';
              
              return (
                <div key={`material-detail-${index}`} className="border border-gray-100 rounded p-1 bg-gray-50">
                  <div className="flex items-start gap-1">
                    <div
                      className="w-2 h-2 rounded border border-gray-300 flex-shrink-0 mt-1"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-xs truncate">
                        {material?.name || 'Materiale non specificato'}
                      </div>
                      {material?.category && (
                        <div className="text-xs text-gray-600 capitalize truncate">
                          {material.category}
                        </div>
                      )}
                      {material?.brand && (
                        <div className="text-xs text-gray-600 truncate">
                          {material.brand}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs font-mono px-1 py-0">
                          {layer.thickness}mm
                        </Badge>
                        {material?.unit_cost && (
                          <span className="text-xs text-gray-500 truncate">
                            €{material.unit_cost}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Performance compatte in fondo */}
          {(stratigraphy.fire_resistance_class || stratigraphy.acoustic_performance) && (
            <div className="mt-2 pt-2 border-t space-y-1">
              <div className="text-xs font-semibold mb-1">Performance</div>
              {stratigraphy.fire_resistance_class && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate">Fuoco:</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">{stratigraphy.fire_resistance_class}</Badge>
                </div>
              )}
              {stratigraphy.acoustic_performance && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate">Acustica:</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">{stratigraphy.acoustic_performance} dB</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StratigraphyMaterialsSummary;
