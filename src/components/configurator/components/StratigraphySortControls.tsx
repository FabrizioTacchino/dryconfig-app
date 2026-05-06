
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortField = 'name' | 'total_thickness' | 'weight_per_sqm' | 'cost_per_sqm' | 'acoustic_performance' | 'fire_resistance_class' | 'supplier_name';
export type SortDirection = 'asc' | 'desc';

interface StratigraphySortControlsProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const StratigraphySortControls = ({
  sortField,
  sortDirection,
  onSortChange,
}: StratigraphySortControlsProps) => {
  const sortOptions = [
    { value: 'name' as SortField, label: 'Nome' },
    { value: 'total_thickness' as SortField, label: 'Spessore (mm)' },
    { value: 'weight_per_sqm' as SortField, label: 'Peso (kg/m²)' },
    { value: 'cost_per_sqm' as SortField, label: 'Prezzo (€/m²)' },
    { value: 'acoustic_performance' as SortField, label: 'Abbattimento Acustico (dB)' },
    { value: 'fire_resistance_class' as SortField, label: 'Resistenza al Fuoco' },
    { value: 'supplier_name' as SortField, label: 'Fornitore' },
  ];

  const toggleDirection = () => {
    onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Ordina per:</span>
      
      <Select
        value={sortField}
        onValueChange={(value: SortField) => onSortChange(value, sortDirection)}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleDirection}
        className="gap-2"
      >
        {sortDirection === 'asc' ? (
          <>
            <ArrowUp className="h-4 w-4" />
            Crescente
          </>
        ) : (
          <>
            <ArrowDown className="h-4 w-4" />
            Decrescente
          </>
        )}
      </Button>
    </div>
  );
};

export default StratigraphySortControls;
