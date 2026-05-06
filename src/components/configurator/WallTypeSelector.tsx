
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WallType } from '@/types';

interface WallTypeSelectorProps {
  wallType: WallType | 'all';
  onWallTypeChange: (type: WallType | 'all') => void;
  showAllOption?: boolean;
}

const WallTypeSelector = ({ wallType, onWallTypeChange, showAllOption = true }: WallTypeSelectorProps) => {
  // Define supported wall types for display in the UI
  // Note: Only showing the commonly used ones in the UI but supporting all in types
  const wallTypes: (WallType | 'all')[] = showAllOption 
    ? ['all', 'plating', 'counterwall', 'single', 'double', 'ceiling']
    : ['plating', 'counterwall', 'single', 'double', 'ceiling'];
  
  // Include all possible WallType values in the labels record
  const labels: Record<WallType | 'all', string> = {
    all: 'Tutte',
    plating: 'Placcatura',
    counterwall: 'Controparete',
    single: 'Parete singola',
    double: 'Parete doppia',
    ceiling: 'Controsoffitto',
    internal: 'Interna',
    external: 'Esterna',
    roof: 'Copertura',
    foundation: 'Fondazione',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleziona tipologia</CardTitle>
        <CardDescription>
          Scegli la tipologia di parete o controsoffitto da configurare
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${showAllOption ? 'grid-cols-2 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-5'}`}>
          {wallTypes.map((type) => (
            <div
              key={type}
              className={`border rounded-lg p-4 text-center cursor-pointer transition-all ${
                wallType === type ? 'border-construction-primary bg-construction-primary/5' : 'hover:border-gray-300'
              }`}
              onClick={() => onWallTypeChange(type)}
            >
              <div className="font-medium">{labels[type]}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WallTypeSelector;
