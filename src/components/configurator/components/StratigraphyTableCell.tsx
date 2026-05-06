
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { calculateActualThicknessFromDatabase } from '../utils/databaseLayerUtils';

interface StratigraphyTableCellProps {
  type: 'thickness' | 'weight' | 'fire' | 'acoustic' | 'price' | 'supplier';
  value?: number | string | null;
  supplierName?: string;
  className?: string;
  layers?: any[]; // Database layers structure
  showCostWarning?: boolean;
  // 🎯 PROPS per i costi comprensivi
  comprehensiveCost?: number;
  hasComprehensiveCost?: boolean;
}

const StratigraphyTableCell = ({ 
  type, 
  value, 
  supplierName, 
  className,
  layers = [],
  showCostWarning = false,
  comprehensiveCost,
  hasComprehensiveCost = false
}: StratigraphyTableCellProps) => {
  const renderContent = () => {
    switch (type) {
      case 'thickness':
        // Use correct thickness calculation with structural group logic
        const actualThickness = layers.length > 0 ? calculateActualThicknessFromDatabase(layers) : value;
        return (
          <div className="font-mono text-xs">
            {actualThickness ? `${actualThickness} mm` : '-'}
          </div>
        );
      
      case 'weight':
        return (
          <div className="font-mono text-xs">
            {value && typeof value === 'number' && value > 0 ? `${value} kg/m²` : '-'}
          </div>
        );
      
      case 'fire':
        return (
          <div className="font-medium text-xs">
            {value || '-'}
          </div>
        );
      
      case 'acoustic':
        return (
          <div className="font-mono text-xs">
            {value && typeof value === 'number' && value > 0 ? `${value} dB` : '-'}
          </div>
        );
      
      case 'price':
        // 🎯 USA SEMPRE E SOLO IL COSTO COMPRENSIVO
        const displayValue = comprehensiveCost || 0;
        const isComprehensive = hasComprehensiveCost && comprehensiveCost;
        
        console.log(`[StratigraphyTableCell] 💰 PREZZO FINALE:`, {
          comprehensiveCost,
          hasComprehensiveCost,
          displayValue,
          isComprehensive
        });
        
        return (
          <div className="flex items-center gap-2">
            <div className={`font-mono text-xs font-bold ${isComprehensive ? 'text-primary' : ''}`}>
              {displayValue && typeof displayValue === 'number' && displayValue > 0 ? `€${Number(displayValue).toFixed(2)}` : '-'}
            </div>
            {isComprehensive && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-green-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Costo comprensivo con tutti gli accessori</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!isComprehensive && showCostWarning && displayValue && typeof displayValue === 'number' && displayValue < 50 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Costo base - Aggiorna per includere viti e accessori</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      
      case 'supplier':
        return (
          <div className="text-xs truncate" title={supplierName}>
            {supplierName || '-'}
          </div>
        );
      
      default:
        return <span>-</span>;
    }
  };

  return (
    <TableCell className={cn("py-2 px-3", className)}>
      {renderContent()}
    </TableCell>
  );
};

export default StratigraphyTableCell;
