
import React from 'react';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';
import StratigraphyTableView from './components/StratigraphyTableView';
import { SortField, SortDirection } from '@/hooks/useUnifiedStratigraphies/types';
import { RadioGroup } from '@/components/ui/radio-group';

interface StratigraphySelectorProps {
  stratigraphies: UnifiedStratigraphy[];
  selectedStratigraphy: string;
  onStratigraphySelect: (id: string) => void;
  showActions?: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onUpdatePrices?: (stratigraphyId: string) => void;
  isUpdatingPrices?: boolean;
}

const StratigraphySelector = ({ 
  stratigraphies, 
  selectedStratigraphy, 
  onStratigraphySelect,
  showActions = true,
  sortField,
  sortDirection,
  onSortChange,
  onUpdatePrices,
  isUpdatingPrices = false
}: StratigraphySelectorProps) => {
  // Debug log for supplier data
  React.useEffect(() => {
    console.log('StratigraphySelector stratigraphies with suppliers:', 
      stratigraphies.map(s => ({
        name: s.name,
        supplier: s.supplier_name,
        layers: s.layers?.length || 0
      }))
    );
  }, [stratigraphies]);

  return (
    <StratigraphyTableView
      stratigraphies={stratigraphies}
      selectedStratigraphy={selectedStratigraphy}
      onStratigraphySelect={onStratigraphySelect}
      showActions={showActions}
      sortField={sortField}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      onUpdatePrices={onUpdatePrices}
      isUpdatingPrices={isUpdatingPrices}
    />
  );
};

export default StratigraphySelector;
