
import React from 'react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateActualThicknessFromDatabase } from '../utils/databaseLayerUtils';

interface StratigraphyGeneralInfoProps {
  stratigraphy: DatabaseStratigraphy;
  className?: string;
}

const StratigraphyGeneralInfo = ({ stratigraphy, className = '' }: StratigraphyGeneralInfoProps) => {
  const layers = stratigraphy.layers || [];
  const isCompact = className.includes('text-xs');
  
  // Calculate correct thickness using the proper structural group logic
  const actualThickness = layers.length > 0 ? calculateActualThicknessFromDatabase(layers) : stratigraphy.total_thickness;
  
  return (
    <Card className={className}>
      <CardHeader className={isCompact ? "pb-1" : "pb-3"}>
        <CardTitle className={isCompact ? "text-xs font-semibold" : "text-base"}>Informazioni Generali</CardTitle>
      </CardHeader>
      <CardContent className={`space-y-${isCompact ? '1' : '2'} ${isCompact ? 'p-2' : ''}`}>
        <div className={`flex justify-between ${isCompact ? 'text-xs' : 'text-sm'}`}>
          <span className="text-gray-600 truncate">Nome:</span>
          <span className="font-medium truncate">{stratigraphy.name}</span>
        </div>
        <div className={`flex justify-between ${isCompact ? 'text-xs' : 'text-sm'}`}>
          <span className="text-gray-600">Tipo:</span>
          <span className="font-medium capitalize">{stratigraphy.type}</span>
        </div>
        <div className={`flex justify-between ${isCompact ? 'text-xs' : 'text-sm'}`}>
          <span className="text-gray-600">Spessore totale:</span>
          <span className="font-bold text-primary">{actualThickness}mm</span>
        </div>
        <div className={`flex justify-between ${isCompact ? 'text-xs' : 'text-sm'}`}>
          <span className="text-gray-600">Numero layer:</span>
          <span className="font-medium">{layers.length}</span>
        </div>
        {stratigraphy.is_certified && (
          <div className={`flex justify-between ${isCompact ? 'text-xs' : 'text-sm'}`}>
            <span className="text-gray-600">Certificata:</span>
            <Badge variant="secondary" className={isCompact ? "text-xs px-1 py-0" : "text-xs"}>Sì</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StratigraphyGeneralInfo;
