
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';
import { useCertifiedStratigraphySave } from '@/hooks/useCertifiedStratigraphySave';
import { useStratigraphyComprehensiveCost } from '@/hooks/useStratigraphyComprehensiveCost';
import { useCertifiedStratigraphyForm } from '../hooks/useCertifiedStratigraphyForm';
import { useSharedStratigraphyLayers } from '../hooks/useSharedStratigraphyLayers';
import CertifiedStratigraphyFormSections from './CertifiedStratigraphyFormSections';
import NestedLayerComposition from './NestedLayerComposition';
import StratigraphyPreview from '../StratigraphyPreview';

interface CertifiedStratigraphyFormContainerProps {
  onSave: (data: any) => Promise<void>;
  isSaving?: boolean;
  editingStratigraphy?: any;
}

const CertifiedStratigraphyFormContainer = ({ 
  onSave, 
  isSaving = false, 
  editingStratigraphy
}: CertifiedStratigraphyFormContainerProps) => {
  const { data: allMaterials = [] } = useMaterials();
  
  // Use the same perfect hooks as personalized stratigraphy
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

  // Use certified form hook
  const {
    formData,
    handleFormChange,
    resetForm
  } = useCertifiedStratigraphyForm(layers, editingStratigraphy);

  // Same finish level state as personalized
  const [finishLevel, setFinishLevel] = useState<string>('Q1');
  
  // Same comprehensive cost calculation as personalized
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

  const { mutate: saveCertified, isPending: isInternalSaving } = useCertifiedStratigraphySave();

  // 🔥 CRITICAL: Initialize layers immediately when editing stratigraphy loads
  useEffect(() => {
    if (editingStratigraphy && editingStratigraphy.stratigraphy) {
      console.log('[CertifiedFormContainer] 🚀 INITIALIZING LAYERS FROM EDITING STRATIGRAPHY:', {
        id: editingStratigraphy.stratigraphy.id,
        name: editingStratigraphy.stratigraphy.name,
        layersAvailable: !!editingStratigraphy.stratigraphy.layers,
        layersCount: editingStratigraphy.stratigraphy.layers?.length || 0,
        hasCertification: !!editingStratigraphy.certification,
        materialsCount: editingStratigraphy.materials?.length || 0
      });
      
      // Initialize layers first - this should populate the preview
      initializeFromStratigraphy(editingStratigraphy.stratigraphy);
    }
  }, [editingStratigraphy, initializeFromStratigraphy]);

  // Debug log for layers state changes
  useEffect(() => {
    console.log('[CertifiedFormContainer] 📊 LAYERS STATE UPDATED:', {
      layersCount: layers.length,
      layersWithMaterials: layers.filter(l => l.material).length,
      layersWithScrews: layers.filter(l => l.screwMaterialId).length,
      totalThickness,
      layerDetails: layers.map(l => ({
        id: l.id,
        material: l.material?.name,
        thickness: l.thickness,
        position: l.position
      }))
    });
  }, [layers, totalThickness]);

  // Debug log for form data state
  useEffect(() => {
    console.log('[CertifiedFormContainer] 📝 FORM DATA STATE:', {
      name: formData.name,
      fire_resistance: formData.fire_resistance,
      solution_number: formData.solution_number,
      acoustic_reduction: formData.acoustic_reduction,
      supplier_name: formData.supplier_name,
      materialsCount: formData.materials?.length || 0,
      formFullyPopulated: !!(formData.name && formData.fire_resistance)
    });
  }, [formData]);

  // Same supplier filtering as personalized
  const filteredMaterials = React.useMemo(() => {
    if (!formData.selectedSupplier || formData.selectedSupplier === 'all') {
      return allMaterials;
    }
    return allMaterials.filter(material => 
      material.supplier === formData.selectedSupplier
    );
  }, [allMaterials, formData.selectedSupplier]);

  // Same validation logic as personalized
  const isNameValid = formData.name.trim().length > 0;
  const hasValidLayers = validLayersCount > 0;
  const isFormValid = isNameValid && hasValidLayers;

  // Same save logic as personalized but adapted for certified
  const handleSave = async () => {
    if (!isFormValid) {
      console.log('[CertifiedFormContainer] ❌ Form not valid - Name:', isNameValid, 'Layers:', hasValidLayers);
      return;
    }

    console.log('[CertifiedFormContainer] 🔥 SAVING WITH COMPREHENSIVE DATA:', {
      comprehensiveCost,
      totalInstallTime: comprehensiveCost?.totalInstallTimeMinutes,
      laborCost: comprehensiveCost?.laborCost,
      totalCost: comprehensiveCost?.total
    });

    const saveData = {
      // Basic form data
      name: formData.name,
      description: formData.description,
      type: formData.type,
      
      // Layer data (same as personalized)
      layers: layers,
      totalThickness,
      weightPerSqm,
      
      // Same cost calculation as personalized
      estimatedCost: comprehensiveCost?.total || 0,
      previewCosts: {
        materialCost: comprehensiveCost?.materialCost || 0,
        laborCost: comprehensiveCost?.laborCost || 0,
        screwCost: comprehensiveCost?.screwCost || 0,
        totalInstallTime: comprehensiveCost?.totalInstallTimeMinutes || 0,
        total: comprehensiveCost?.total || 0
      },
      
      // Pass the comprehensive cost breakdown for saving
      materialCost: comprehensiveCost?.materialCost || 0,
      screwCost: comprehensiveCost?.screwCost || 0,
      laborCost: comprehensiveCost?.laborCost || 0,
      totalCost: comprehensiveCost?.total || 0,
      installationTime: comprehensiveCost?.totalInstallTimeMinutes || 0,
      
      // Certification fields now available
      fire_resistance: formData.fire_resistance || '',
      solution_number: formData.solution_number || '',
      materials: formData.materials || [],
      // Optional certification fields
      max_height: formData.max_height,
      acoustic_reduction: formData.acoustic_reduction,
      acoustic_report_code: formData.acoustic_report_code,
      solution_code: formData.solution_code,
      extension_code: formData.extension_code,
      supplier_name: formData.supplier_name,
      wall_thickness: formData.wall_thickness,
      structure_width: formData.structure_width,
      fire_test_report_code: formData.fire_test_report_code,
      catalog_page: formData.catalog_page,
      curvature_radius: formData.curvature_radius,
      curvature_radius_description: formData.curvature_radius_description,
      break_resistance: formData.break_resistance,
      break_resistance_report_code: formData.break_resistance_report_code,
      break_resistance_notes: formData.break_resistance_notes,
    };

    console.log('[CertifiedFormContainer] 💾 CERTIFIED STRATIGRAPHY SAVE DATA:', saveData);

    try {
      if (onSave) {
        await onSave(saveData);
      } else {
        saveCertified(saveData as any, {
          onSuccess: () => {
            console.log('[CertifiedFormContainer] ✅ SAVE COMPLETED');
            // Only reset form if we're not editing (creating new)
            if (!editingStratigraphy) {
              resetForm();
              setLayers([]);
              console.log('[CertifiedFormContainer] ✅ FORM RESET AFTER SUCCESSFUL SAVE');
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ [CertifiedFormContainer] SAVE ERROR:', error);
    }
  };

  const finalIsSaving = isSaving || isInternalSaving;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      {/* Left side - Form and Layer Composition */}
      <div className="space-y-6">
        {/* Certification form sections */}
        <CertifiedStratigraphyFormSections
          formData={formData}
          onFormChange={handleFormChange}
          layers={layers}
        />

        {/* Same perfect layer composition as personalized */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Composizione Stratigrafica</h3>
          
          <NestedLayerComposition
            layers={layers}
            onLayersChange={setLayers}
            onAddLayer={handleAddLayer}
            totalThickness={totalThickness}
            availableMaterials={filteredMaterials}
            isEditMode={!!editingStratigraphy}
            showLayerCosts={true}
            finishLevel={finishLevel}
            advancedBreakdown={comprehensiveCost}
          />
        </div>

        {/* Same save button as personalized */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave}
            disabled={finalIsSaving || !isFormValid}
            className="min-w-[200px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {finalIsSaving ? 'Salvataggio...' : editingStratigraphy ? 'Aggiorna' : 'Salva Stratigrafia Certificata'}
          </Button>
        </div>
      </div>

      {/* Right side - Same Preview as Personalized */}
      <div className="space-y-6">
        <StratigraphyPreview 
          layers={layers}
          totalThickness={totalThickness}
          showLayerCosts={true}
          advancedBreakdown={comprehensiveCost}
          useStoredCosts={false}
        />
      </div>
    </div>
  );
};

export default CertifiedStratigraphyFormContainer;
