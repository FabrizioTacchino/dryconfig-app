
import React, { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';
import { usePersonalizedStratigraphyValidation } from '../hooks/usePersonalizedStratigraphyValidation';
import { useSharedStratigraphyLayers } from '../hooks/useSharedStratigraphyLayers';
import { usePersonalizedStratigraphyForm } from '../hooks/usePersonalizedStratigraphyForm';
import { useIntegratedStratigraphySave } from '@/hooks/useIntegratedStratigraphySave';
import { useStratigraphyComprehensiveCost } from '@/hooks/useStratigraphyComprehensiveCost';
import PersonalizedStratigraphyFormSections from './PersonalizedStratigraphyFormSections';
import NestedLayerComposition from './NestedLayerComposition';
import StratigraphyPreview from '../StratigraphyPreview';

interface PersonalizedStratigraphyFormContainerProps {
  onSave: (data: any) => Promise<void>;
  isSaving?: boolean;
  editingStratigraphy?: any;
  onResetForm?: () => void;
  onResetLayers?: () => void;
  viewOnly?: boolean;
}

const PersonalizedStratigraphyFormContainer = ({ 
  onSave, 
  isSaving = false, 
  editingStratigraphy,
  onResetForm,
  onResetLayers,
  viewOnly = false
}: PersonalizedStratigraphyFormContainerProps) => {
  const { data: allMaterials = [] } = useMaterials();
  const { mutate: saveIntegrated, isPending: isIntegratedSaving } = useIntegratedStratigraphySave();
  
  // Hardcoded finish levels since we removed the database functionality
  const finishLevels = [
    { finish_level: 'Q1', cost_multiplier: 1, time_multiplier: 1 },
    { finish_level: 'Q2', cost_multiplier: 1.1, time_multiplier: 1.1 },
    { finish_level: 'Q3', cost_multiplier: 1.2, time_multiplier: 1.2 },
    { finish_level: 'Q4', cost_multiplier: 1.3, time_multiplier: 1.3 }
  ];

  const {
    layers,
    setLayers,
    handleAddLayer,
    totalThickness,
    estimatedCost,
    weightPerSqm,
    validLayersCount,
    initializeFromStratigraphy
  } = useSharedStratigraphyLayers();

  const {
    formData,
    handleFormChange,
    resetForm
  } = usePersonalizedStratigraphyForm({ layers, editingStratigraphy });

  const { isNameValid, hasValidLayers, isFormValid } = usePersonalizedStratigraphyValidation(formData, layers);

  // Filtered materials based on selected supplier
  const filteredMaterials = useMemo(() => {
    if (!formData.selectedSupplier || formData.selectedSupplier === 'all') {
      return allMaterials;
    }

    const filtered = allMaterials.filter(material => 
      material.supplier === formData.selectedSupplier
    );

    console.log('[PersonalizedStratigraphyFormContainer] 🔍 SUPPLIER FILTER:', {
      selectedSupplier: formData.selectedSupplier,
      totalMaterials: allMaterials.length,
      filteredMaterials: filtered.length
    });

    return filtered;
  }, [allMaterials, formData.selectedSupplier]);

  // 🎯 CALCOLO PREVIEW - IDENTICO AL SALVATAGGIO - FIX: correctly destructure data as comprehensiveCost
  const { data: comprehensiveCost } = useStratigraphyComprehensiveCost({
    layers: layers.map(layer => ({
      id: layer.id,
      position: layer.position,
      thickness: layer.thickness,
      inter_axis: layer.interAxis,
      screwMaterialId: layer.screwMaterialId,
      screwQuantity: layer.screwQuantity,
      screwCostPerSqm: layer.screwCostPerSqm,
      materials: layer.material ? {
        id: layer.material.id,
        name: layer.material.name,
        category: layer.material.category,
        unit_price: layer.material.unit_price || 0,
        incidence_per_sqm: layer.material.incidence_per_sqm,
        incidence_base: layer.material.incidence_base,
        installation_time_per_sqm: layer.material.installation_time_per_sqm || 0
      } : undefined
    })).filter(layer => layer.materials),
    enabled: layers.length > 0,
    finishLevel: formData.finishLevel
  });

  console.log('🎯 [PersonalizedStratigraphyFormContainer] PREVIEW IDENTICO AL SALVATAGGIO:', {
    installTime: comprehensiveCost?.totalInstallTimeMinutes,
    laborCost: comprehensiveCost?.laborCost,
    totalCost: comprehensiveCost?.total
  });

  // Initialize layers from editingStratigraphy when it's available
  useEffect(() => {
    if (editingStratigraphy) {
      console.log('[PersonalizedStratigraphyFormContainer] 🔄 INITIALIZING EDITING STRATIGRAPHY:', {
        id: editingStratigraphy.id,
        name: editingStratigraphy.name || editingStratigraphy.stratigraphy?.name
      });

      const stratigraphyData = editingStratigraphy.stratigraphy || editingStratigraphy;
      initializeFromStratigraphy(stratigraphyData);
    }
  }, [editingStratigraphy, initializeFromStratigraphy]);

  console.log('[PersonalizedStratigraphyFormContainer] 🔄 SISTEMA TRASPARENTE:', {
    total: layers.length,
    layersWithScrews: layers.filter(l => l.screwMaterialId).length,
    isFormValid,
    hasValidLayers,
    totalThickness,
    estimatedCost,
    editingStratigraphyId: editingStratigraphy?.id,
    filteredMaterialsCount: filteredMaterials.length,
    viewOnly
  });

  const handleAddBoardLayer = () => {
    console.log('[PersonalizedStratigraphyFormContainer] ➕ ADDING LAYER');
    
    const newLayer = {
      id: `layer-${Date.now()}-${Math.random()}`,
      materialId: '',
      thickness: 12.5,
      position: layers.length + 1,
      category: 'board' as const,
      calculatedCostPerSqm: 0,
      screwMaterialId: undefined,
      screwMaterial: undefined,
      screwQuantity: undefined,
      screwCostPerSqm: 0,
    };

    setLayers([...layers, newLayer]);
  };

  const handleIntegratedSave = async () => {
    if (!isFormValid) {
      console.log('[PersonalizedStratigraphyFormContainer] ❌ Form not valid');
      return;
    }

    console.log('[PersonalizedStratigraphyFormContainer] 🚀 SALVATAGGIO IDENTICO AL PREVIEW');
    console.log('[PersonalizedStratigraphyFormContainer] 🎯 PREVIEW VALUES TO SAVE:', {
      installTime: comprehensiveCost?.totalInstallTimeMinutes,
      laborCost: comprehensiveCost?.laborCost,
      totalCost: comprehensiveCost?.total
    });
    
    const saveData = {
      id: editingStratigraphy?.id,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      layers: layers, // Passa tutti i layer con dati viti integrati
      totalThickness,
      estimatedCost,
      weightPerSqm
    };

    try {
      await saveIntegrated(saveData);
      console.log('✅ [PersonalizedStratigraphyFormContainer] SALVATAGGIO COMPLETATO - VALORI IDENTICI AL PREVIEW!');
      
      if (!editingStratigraphy) {
        console.log('🔄 [PersonalizedStratigraphyFormContainer] RESETTING FORM');
        resetForm();
        setLayers([]);
      }
    } catch (error) {
      console.error('❌ [PersonalizedStratigraphyFormContainer] SAVE ERROR:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      {/* Left side - Form and Layer Composition */}
      <div className="space-y-6">
        {/* Only show form sections if not in viewOnly mode */}
        {!viewOnly && (
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <PersonalizedStratigraphyFormSections
              formData={formData}
              onFormChange={handleFormChange}
              finishLevels={finishLevels}
              availableMaterials={allMaterials}
            />
          </form>
        )}

        {/* Composizione con Sistema Integrato */}
        <NestedLayerComposition
          layers={layers}
          onLayersChange={setLayers}
          onAddLayer={handleAddBoardLayer}
          totalThickness={totalThickness}
          availableMaterials={filteredMaterials}
          isEditMode={!!editingStratigraphy}
          showLayerCosts={true}
          finishLevel={formData.finishLevel}
          finishLevels={finishLevels}
          advancedBreakdown={comprehensiveCost}
          viewOnly={viewOnly}
        />

        {/* Save Button - Hide in viewOnly mode */}
        {!viewOnly && (
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleIntegratedSave}
              disabled={isIntegratedSaving || !isFormValid}
            >
              <Save className="h-4 w-4 mr-2" />
              {isIntegratedSaving ? 'Salvataggio...' : 'Salva Stratigrafia'}
            </Button>
          </div>
        )}
      </div>

      {/* Right side - Preview */}
      <div className="space-y-6">
        <StratigraphyPreview 
          layers={layers}
          totalThickness={totalThickness}
          showLayerCosts={true}
          advancedBreakdown={comprehensiveCost}
          useStoredCosts={false} // 🎯 Usa sempre il calcolo live identico al salvataggio
        />
      </div>
    </div>
  );
};

export default PersonalizedStratigraphyFormContainer;
