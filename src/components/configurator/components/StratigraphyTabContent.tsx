
import React from 'react';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies/types';
import { SortField, SortDirection } from '@/hooks/useUnifiedStratigraphies/types';
import StratigraphySelector from '../StratigraphySelector';
import StratigraphyDetails from './StratigraphyDetails';

interface StratigraphyTabContentProps {
  stratigraphies: UnifiedStratigraphy[];
  selectedStratigraphy: string;
  onStratigraphySelect: (id: string) => void;
  selectedStratigraphyData: UnifiedStratigraphy | null;
  isStandalone: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onUpdatePrices?: (stratigraphyId: string) => void;
  isUpdatingPrices?: boolean;
}

const StratigraphyTabContent = ({
  stratigraphies,
  selectedStratigraphy,
  onStratigraphySelect,
  selectedStratigraphyData,
  isStandalone,
  sortField,
  sortDirection,
  onSortChange,
  onUpdatePrices,
  isUpdatingPrices = false
}: any) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_410px] gap-6 min-h-[520px]">
      {/* Lista stratigrafie */}
      <div className="space-y-4">
        <StratigraphySelector
          stratigraphies={stratigraphies}
          selectedStratigraphy={selectedStratigraphy}
          onStratigraphySelect={onStratigraphySelect}
          showActions={true}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          onUpdatePrices={onUpdatePrices}
          isUpdatingPrices={isUpdatingPrices}
        />
      </div>

      {/* Dettagli stratigrafia selezionata - SEMPRE CENTRATO E FISSATO */}
      <div className="w-full flex items-start justify-center sticky top-6 self-start max-h-[calc(100vh-120px)]">
        <div className="w-full max-w-[390px] flex items-center justify-center min-h-[520px]">
          {selectedStratigraphyData ? (
            <StratigraphyDetails 
              stratigraphy={selectedStratigraphyData}
              isStandalone={isStandalone}
            />
          ) : (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <div className="opacity-40 text-4xl mb-3">📋</div>
              <div>Seleziona una stratigrafia per vedere i dettagli</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StratigraphyTabContent;
