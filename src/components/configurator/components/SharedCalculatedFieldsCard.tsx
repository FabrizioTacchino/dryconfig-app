
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Wrench } from 'lucide-react';
import { DatabaseMaterial } from '@/hooks/useMaterials';

interface SharedCalculatedFieldsCardProps {
  totalThickness: number;
  structureWidth: number;
  layersCount: number;
  estimatedCost: number;
  weightPerSqm: number;
  layers?: any[];
  materials?: DatabaseMaterial[];
}

const SharedCalculatedFieldsCard = ({
  totalThickness,
  structureWidth,
  layersCount,
  estimatedCost,
  weightPerSqm,
  layers = [],
  materials = []
}: SharedCalculatedFieldsCardProps) => {
  // For integrated system, calculate screws from layer data directly
  const integratedScrews = layers
    .filter(layer => layer.screwMaterial && layer.screwQuantity)
    .map(layer => ({
      screw: layer.screwMaterial,
      quantityPerSqm: layer.screwQuantity,
      totalCostPerSqm: layer.screwCostPerSqm || 0,
      unitPrice: layer.screwMaterial.unit_price || 0,
      label: `Per ${layer.material?.name || 'layer'}`
    }));

  const totalScrewsCostPerSqm = integratedScrews.reduce((sum, entry) => sum + entry.totalCostPerSqm, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Riepilogo Stratigrafia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Spessore Totale</p>
            <Badge variant="outline" className="text-sm">
              {totalThickness.toFixed(1)} mm
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Layer Validi</p>
            <Badge variant="outline" className="text-sm">
              {layersCount} layer{layersCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Costo Stimato</p>
            <Badge variant="outline" className="text-sm">
              €{estimatedCost.toFixed(2)}/m²
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Peso</p>
            <Badge variant="outline" className="text-sm">
              {weightPerSqm.toFixed(2)} kg/m²
            </Badge>
          </div>
        </div>

        {structureWidth > 0 && (
          <div className="pt-2 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Larghezza Struttura</p>
              <Badge variant="outline" className="text-sm">
                {structureWidth} mm
              </Badge>
            </div>
          </div>
        )}

        {/* Sezione viti integrate */}
        {integratedScrews.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Viti integrate</span>
            </div>
            <div className="space-y-1">
              {integratedScrews.map((entry, idx) => (
                <div key={idx} className="pl-2 mb-1">
                  <span className="block font-medium text-sm">{entry.screw.name}</span>
                  <span className="block text-xs text-muted-foreground">{entry.label}</span>
                  <span className="block text-xs">
                    Costo: <span className="font-semibold">€{entry.unitPrice.toFixed(3)}</span> cad &middot; <span className="font-semibold">€{entry.totalCostPerSqm.toFixed(2)}</span>/m²
                  </span>
                </div>
              ))}
              <div className="flex justify-end mt-1">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300" variant="outline">
                  Totale viti: €{totalScrewsCostPerSqm.toFixed(2)}/m²
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedCalculatedFieldsCard;
