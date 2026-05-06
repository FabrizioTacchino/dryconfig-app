
import React, { useState } from 'react';
import { useIntegratedStratigraphySave } from '@/hooks/useIntegratedStratigraphySave';
import { useStratigraphyComprehensiveCost } from '@/hooks/useStratigraphyComprehensiveCost';
import PersonalizedStratigraphyFormSections from './components/PersonalizedStratigraphyFormSections';
import PersonalizedStratigraphySubmissionHandler from './components/PersonalizedStratigraphySubmissionHandler';
import PersonalizedStratigraphyValidation from './components/PersonalizedStratigraphyValidation';
import { usePersonalizedStratigraphyForm } from './hooks/usePersonalizedStratigraphyForm';
import { useSharedStratigraphyLayers } from './hooks/useSharedStratigraphyLayers';
import { Layer } from './types/StratigraphyTypes';
import { WallType } from '@/types';

interface PersonalizedStratigraphyFormContainerProps {
  onSaveSuccess?: () => void;
  editingStratigraphyId?: string;
}

const PersonalizedStratigraphyFormContainer: React.FC<PersonalizedStratigraphyFormContainerProps> = ({
  onSaveSuccess,
  editingStratigraphyId
}) => {
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
  } = usePersonalizedStratigraphyForm({ layers, editingStratigraphy: null });

  const [finishLevel, setFinishLevel] = useState<string>('Q1');
  
  // 🔥 CALCOLA I COSTI COMPRENSIVI CORRETTI DAL PREVIEW
  const { data: comprehensiveCost, isLoading: isCostLoading } = useStratigraphyComprehensiveCost({
    layers: layers.map(layer => ({
      id: layer.id,
      position: layer.position,
      thickness: layer.thickness || layer.material?.thickness || 0,
      inter_axis: layer.interAxis,
      screwMaterialId: layer.screwMaterialId,
      screwQuantity: layer.screwQuantity,
      screwCostPerSqm: layer.screwCostPerSqm,
      materials: layer.material ? {
        id: layer.material.id,
        name: layer.material.name,
        category: layer.material.category,
        unit_price: layer.material.unit_price,
        incidence_per_sqm: layer.material.incidence_per_sqm,
        incidence_base: layer.material.incidence_base,
        installation_time_per_sqm: layer.material.installation_time_per_sqm
      } : undefined
    })),
    enabled: layers.length > 0,
    finishLevel
  });

  const { mutate: saveIntegrated, isPending: isSaving } = useIntegratedStratigraphySave();

  const handleSave = () => {
    console.log('[PersonalizedStratigraphyFormContainer] 🔥 SALVATAGGIO CON VALORI PREVIEW CORRETTI:', {
      comprehensiveCost,
      totalInstallTime: comprehensiveCost?.totalInstallTimeMinutes,
      laborCost: comprehensiveCost?.laborCost,
      totalCost: comprehensiveCost?.total
    });

    const saveData = {
      id: editingStratigraphyId,
      name: formData.name,
      description: formData.description,
      type: formData.type as WallType,
      layers: layers,
      totalThickness,
      weightPerSqm,
      // 🔥 USA I VALORI CORRETTI DAL PREVIEW INVECE DI estimatedCost
      estimatedCost: comprehensiveCost?.total || 0,
      // 🔥 PASSA I VALORI DETTAGLIATI DEL PREVIEW
      previewCosts: {
        materialCost: comprehensiveCost?.materialCost || 0,
        laborCost: comprehensiveCost?.laborCost || 0,
        screwCost: comprehensiveCost?.screwCost || 0,
        totalInstallTime: comprehensiveCost?.totalInstallTimeMinutes || 0,
        total: comprehensiveCost?.total || 0
      }
    };

    console.log('[PersonalizedStratigraphyFormContainer] 💾 DATI SALVATI CON PREVIEW COSTS:', saveData);

    saveIntegrated(saveData, {
      onSuccess: () => {
        console.log('[PersonalizedStratigraphyFormContainer] ✅ SALVATAGGIO COMPLETATO');
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        if (!editingStratigraphyId) {
          resetForm();
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <PersonalizedStratigraphyFormSections
        formData={formData}
        onFormChange={handleFormChange}
        isNameValid={true}
      />

      <PersonalizedStratigraphyValidation
        isNameValid={true}
        hasValidLayers={validLayersCount > 0}
        stratigraphyName={formData.name}
        layersCount={layers.length}
      />

      <PersonalizedStratigraphySubmissionHandler
        formData={formData}
        layers={layers}
        totalThickness={totalThickness}
        comprehensiveCost={comprehensiveCost}
        onSave={handleSave}
        isSaving={isSaving}
        editingStratigraphyId={editingStratigraphyId}
      />
    </div>
  );
};

export default PersonalizedStratigraphyFormContainer;
