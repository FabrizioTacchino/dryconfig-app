
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUnifiedStratigraphies } from '@/hooks/useUnifiedStratigraphies';
import { useStratigraphySelection } from './hooks/useStratigraphySelection';
import StratigraphyFilters from './components/StratigraphyFilters';
import StratigraphyTabContent from './components/StratigraphyTabContent';
import AddToEstimateDialog from './components/AddToEstimateDialog';
import { WallType } from '@/types';
import { toast } from 'sonner';

interface StratigraphyTabProps {
  wallType: WallType | 'all';
  onWallTypeChange: (type: WallType | 'all') => void;
  estimateId: string | null;
  editingStratigraphy?: any;
  initialStratigraphyId?: string | null;
}

const StratigraphyTab = ({ wallType, onWallTypeChange, estimateId, editingStratigraphy, initialStratigraphyId }: StratigraphyTabProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Pass editing stratigraphy to the unified hook
  const {
    stratigraphies,
    isLoading,
    certifiedCount,
    customCount,
    totalCount,
    searchTerm,
    setSearchTerm,
    materialSearchTerm,
    setMaterialSearchTerm,
    fireResistance,
    setFireResistance,
    acousticReduction,
    setAcousticReduction,
    supplierName,
    setSupplierName,
    thicknessRange,
    setThicknessRange,
    sortField,
    sortDirection,
    handleSortChange,
    showCertifiedOnly,
    setShowCertifiedOnly,
    showCustomOnly,
    setShowCustomOnly,
    updateGeneralStratigraphyPrices,
    isUpdatingGeneralPrices
  } = useUnifiedStratigraphies(wallType, editingStratigraphy);

  const { selectedStratigraphy, setSelectedStratigraphy, selectedStratigraphyData } = useStratigraphySelection({
    editingStratigraphy,
    initialStratigraphyId,
    stratigraphies
  });

  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleCreateNew = () => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'builder');
    if (estimateId) params.set('estimate', estimateId);
    navigate(`/configurator?${params.toString()}`);
  };

  const handleAddToEstimate = () => {
    if (!selectedStratigraphy) {
      toast.error('Seleziona una stratigraphy prima di aggiungerla al preventivo');
      return;
    }
    setShowAddDialog(true);
  };

  const isStandalone = !estimateId;

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Caricamento stratigrafie...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtri con layout aggiornato */}
      <StratigraphyFilters
        wallType={wallType}
        onWallTypeChange={onWallTypeChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        materialSearchTerm={materialSearchTerm}
        onMaterialSearchChange={setMaterialSearchTerm}
        showCertifiedOnly={showCertifiedOnly}
        onCertifiedFilterChange={setShowCertifiedOnly}
        showCustomOnly={showCustomOnly}
        onCustomFilterChange={setShowCustomOnly}
        totalCount={totalCount}
        certifiedCount={certifiedCount}
        customCount={customCount}
        disabled={false}
        fireResistance={fireResistance}
        onFireResistanceChange={setFireResistance}
        acousticReduction={acousticReduction}
        onAcousticReductionChange={setAcousticReduction}
        supplierName={supplierName}
        onSupplierNameChange={setSupplierName}
        thicknessRange={thicknessRange}
        onThicknessRangeChange={setThicknessRange}
      />

      {/* Contenuto principale senza header */}
      <StratigraphyTabContent
        stratigraphies={stratigraphies}
        selectedStratigraphy={selectedStratigraphy}
        onStratigraphySelect={setSelectedStratigraphy}
        selectedStratigraphyData={selectedStratigraphyData}
        isStandalone={isStandalone}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onUpdatePrices={updateGeneralStratigraphyPrices}
        isUpdatingPrices={isUpdatingGeneralPrices}
      />

      {showAddDialog && selectedStratigraphyData && estimateId && (
        <AddToEstimateDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          stratigraphy={selectedStratigraphyData}
        />
      )}
    </div>
  );
};

export default StratigraphyTab;
