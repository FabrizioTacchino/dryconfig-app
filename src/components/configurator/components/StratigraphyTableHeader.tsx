
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SortField, SortDirection } from '@/hooks/useUnifiedStratigraphies/types';

interface StratigraphyTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  showActions?: boolean;
}

const StratigraphyTableHeader = ({ 
  sortField, 
  sortDirection, 
  onSortChange, 
  showActions = true 
}: StratigraphyTableHeaderProps) => {
  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">Seleziona</TableHead>
        
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => handleSort('name')}
            className="h-auto p-0 font-semibold justify-start"
          >
            Nome
            {getSortIcon('name')}
          </Button>
        </TableHead>
        
        <TableHead>Tipo</TableHead>
        
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => handleSort('total_thickness')}
            className="h-auto p-0 font-semibold"
          >
            Spessore
            {getSortIcon('total_thickness')}
          </Button>
        </TableHead>
        
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => handleSort('weight_per_sqm')}
            className="h-auto p-0 font-semibold"
          >
            Peso
            {getSortIcon('weight_per_sqm')}
          </Button>
        </TableHead>
        
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => handleSort('cost_per_sqm')}
            className="h-auto p-0 font-semibold"
          >
            Costo
            {getSortIcon('cost_per_sqm')}
          </Button>
        </TableHead>
        
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => handleSort('acoustic_performance')}
            className="h-auto p-0 font-semibold"
          >
            Acustica
            {getSortIcon('acoustic_performance')}
          </Button>
        </TableHead>
        
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => handleSort('fire_resistance_class')}
            className="h-auto p-0 font-semibold"
          >
            Fuoco
            {getSortIcon('fire_resistance_class')}
          </Button>
        </TableHead>
        
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => handleSort('supplier_name')}
            className="h-auto p-0 font-semibold"
          >
            Fornitore
            {getSortIcon('supplier_name')}
          </Button>
        </TableHead>

        <TableHead>Prezzi Aggiornati</TableHead>
        
        {showActions && <TableHead>Azioni</TableHead>}
      </TableRow>
    </TableHeader>
  );
};

export default StratigraphyTableHeader;
