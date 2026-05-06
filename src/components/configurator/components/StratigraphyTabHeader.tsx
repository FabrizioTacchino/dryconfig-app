
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface StratigraphyTabHeaderProps {
  totalCount: number;
  selectedStratigraphy: string;
  isStandalone: boolean;
  onAddToEstimate: () => void;
  onCreateNew: () => void;
}

const StratigraphyTabHeader = ({
  totalCount,
  selectedStratigraphy,
  isStandalone,
  onAddToEstimate,
  onCreateNew
}: StratigraphyTabHeaderProps) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <h3 className="text-base font-semibold">Seleziona stratigrafia</h3>
        <p className="text-xs text-muted-foreground">
          {totalCount} stratigrafie disponibili - Seleziona per vedere anteprima e dettagli
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {selectedStratigraphy && !isStandalone && (
          <Button onClick={onAddToEstimate} className="gap-2 h-8 text-xs px-3">
            <Plus className="h-3 w-3" />
            Aggiungi al Preventivo
          </Button>
        )}
        
        <Button onClick={onCreateNew} variant="outline" className="gap-2 h-8 text-xs px-3">
          <Plus className="h-3 w-3" />
          Crea Nuova
        </Button>
      </div>
    </div>
  );
};

export default StratigraphyTabHeader;
