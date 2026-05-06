
import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies/types';
import { SortField, SortDirection } from '@/hooks/useUnifiedStratigraphies/types';
import StratigraphyTableHeader from './StratigraphyTableHeader';
import StratigraphyTableRow from './StratigraphyTableRow';
import { RadioGroup } from '@/components/ui/radio-group';

interface StratigraphyTableViewProps {
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

const StratigraphyTableView = ({ 
  stratigraphies, 
  selectedStratigraphy, 
  onStratigraphySelect,
  showActions = true,
  sortField,
  sortDirection,
  onSortChange,
  onUpdatePrices,
  isUpdatingPrices = false
}: StratigraphyTableViewProps) => {
  if (stratigraphies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nessuna stratigrafia trovata</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <RadioGroup value={selectedStratigraphy} onValueChange={onStratigraphySelect}>
        <Table>
          <StratigraphyTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            showActions={showActions}
          />
          <TableBody>
            {stratigraphies.map((stratigraphy) => (
              <StratigraphyTableRow
                key={stratigraphy.id}
                stratigraphy={stratigraphy}
                isSelected={selectedStratigraphy === stratigraphy.id}
                onSelect={onStratigraphySelect}
                showActions={showActions}
                onUpdatePrices={onUpdatePrices}
                isUpdatingPrices={isUpdatingPrices}
              />
            ))}
          </TableBody>
        </Table>
      </RadioGroup>
    </div>
  );
};

export default StratigraphyTableView;
