
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Info } from 'lucide-react';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies/types';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StratigraphyActionsMenu from './StratigraphyActionsMenu';

interface StratigraphyTableRowProps {
  stratigraphy: UnifiedStratigraphy;
  isSelected: boolean;
  onSelect: (id: string) => void;
  showActions?: boolean;
  onUpdatePrices?: (stratigraphyId: string) => void;
  isUpdatingPrices?: boolean;
}

const StratigraphyTableRow = ({ 
  stratigraphy, 
  isSelected, 
  onSelect, 
  showActions = true,
  onUpdatePrices,
  isUpdatingPrices = false
}: StratigraphyTableRowProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleUpdatePrices = () => {
    if (onUpdatePrices) {
      onUpdatePrices(stratigraphy.id);
    }
  };

  // 🎯 SOLUZIONE DEFINITIVA: USA SEMPRE E SOLO IL COSTO COMPRENSIVO DAL DATABASE
  const comprehensiveCostFromDB = stratigraphy.comprehensive_cost_per_sqm || 0;
  const hasComprehensiveCost = comprehensiveCostFromDB > 0;
  const hasLayers = stratigraphy.layers && stratigraphy.layers.length > 0;

  // 🔥 USA SEMPRE IL COSTO COMPRENSIVO - BASTA CON I FALLBACK!
  const finalDisplayCost = comprehensiveCostFromDB;

  console.log(`[StratigraphyTableRow] 💰 COSTO FINALE PER "${stratigraphy.name}":`, {
    comprehensive_cost_per_sqm: stratigraphy.comprehensive_cost_per_sqm,
    cost_per_sqm: stratigraphy.cost_per_sqm,
    finalDisplayCost,
    hasComprehensiveCost
  });

  return (
    <TableRow 
      className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => onSelect(stratigraphy.id)}
    >
      <TableCell>
        <RadioGroupItem value={stratigraphy.id} />
      </TableCell>
      
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{stratigraphy.name}</div>
          {stratigraphy.description && (
            <div className="text-sm text-muted-foreground">{stratigraphy.description}</div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {stratigraphy.type}
          </Badge>
          {stratigraphy.is_certified && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Certificata
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm font-mono">
          {stratigraphy.total_thickness}mm
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm font-mono">
          {stratigraphy.weight_per_sqm ? `${stratigraphy.weight_per_sqm.toFixed(1)} kg/m²` : 'N/A'}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="text-sm font-mono font-bold text-primary">
            € {finalDisplayCost.toFixed(2)}
          </div>
          {hasComprehensiveCost && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-green-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Costo comprensivo: materiali, viti,<br/>accessori e manodopera inclusi.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!hasComprehensiveCost && hasLayers && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Aggiorna per il costo comprensivo<br/>con viti e accessori.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {stratigraphy.acoustic_performance 
            ? `${stratigraphy.acoustic_performance} dB` 
            : 'N/A'
          }
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {stratigraphy.fire_resistance_class || 'N/A'}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {stratigraphy.supplier_name || 'N/A'}
        </div>
      </TableCell>

      <TableCell>
        <div className="text-xs space-y-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {hasComprehensiveCost ? 'Costi allineati' : 'Da aggiornare'}
            </span>
          </div>
          <div className={`font-medium ${hasComprehensiveCost ? 'text-green-600' : 'text-amber-600'}`}>
            € {finalDisplayCost.toFixed(2)}
          </div>
          {onUpdatePrices && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdatePrices();
              }}
              disabled={isUpdatingPrices}
              className="h-7 px-2 text-xs w-full"
            >
              {isUpdatingPrices ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Aggiornando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {hasComprehensiveCost ? 'Ricalcola' : 'Calcola Costi'}
                </>
              )}
            </Button>
          )}
        </div>
      </TableCell>
      
      {showActions && (
        <TableCell>
          <StratigraphyActionsMenu stratigraphy={stratigraphy} />
        </TableCell>
      )}
    </TableRow>
  );
};

export default StratigraphyTableRow;
