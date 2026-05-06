
import React, { useState } from 'react';
import { ShieldCheck, Edit } from 'lucide-react';
import CertifiedStratigraphyForm from './components/CertifiedStratigraphyForm';
import { CertifiedStratigraphyFormData } from '@/types/certification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMaterialLookup } from '@/hooks/useMaterialLookup';
import { getCategoryFromPositionType } from '@/hooks/useCertifiedMaterialsAdapter';
import { useNavigate } from 'react-router-dom';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: any;
  interAxis?: number;
  // Integrated screw fields
  screwMaterialId?: string;
  screwMaterial?: any;
  screwQuantity?: number;
  screwCostPerSqm?: number;
}

interface CertifiedStratigraphyTabProps {
  onStratigraphySelect?: (stratigraphyId: string) => void;
  editingStratigraphy?: any;
}

interface CertifiedStratigraphySaveData extends CertifiedStratigraphyFormData {
  layers: Layer[];
}

const CertifiedStratigraphyTab = ({ onStratigraphySelect, editingStratigraphy }: CertifiedStratigraphyTabProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { findMaterialByDescription, findMaterialByCode } = useMaterialLookup();
  const navigate = useNavigate();

  console.log('[CertifiedStratigraphyTab] Editing stratigraphy:', editingStratigraphy);

  // Determine if we're in edit mode
  const isEditMode = editingStratigraphy && editingStratigraphy.stratigraphy?.is_certified;

  console.log('[CertifiedStratigraphyTab] Edit mode:', isEditMode);

  const handleSaveCertifiedStratigraphy = async (data: CertifiedStratigraphySaveData) => {
    try {
      setIsSaving(true);

      if (isEditMode) {
        console.log('[CertifiedStratigraphyTab] UPDATE MODE - updating existing certified stratigraphy');
        await updateCertifiedStratigraphy(data);
      } else {
        console.log('[CertifiedStratigraphyTab] CREATE MODE - creating new certified stratigraphy');
        await createCertifiedStratigraphy(data);
      }

    } catch (error) {
      console.error('❌ [CertifiedStratigraphyTab] SAVE ERROR:', error);
      toast.error('Errore nel salvataggio della stratigrafia certificata');
    } finally {
      setIsSaving(false);
    }
  };

  const createCertifiedStratigraphy = async (data: CertifiedStratigraphySaveData) => {
    // 1. Create the certification first
    const { data: certificationData, error: certError } = await supabase
      .from('certifications')
      .insert({
        name: data.name,
        code: `CERT-${Date.now()}`,
        type: data.type === 'single' ? 'Parete Singola' : 
              data.type === 'double' ? 'Parete Doppia' :
              data.type === 'plating' ? 'Rivestimento' :
              data.type === 'counterwall' ? 'Controparete' : 'Soffitto',
        value: data.fire_resistance,
        certifier: 'Sistema Interno',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 years
        acoustic_reduction: data.acoustic_reduction,
        acoustic_report_code: data.acoustic_report_code,
        max_height: data.max_height,
        solution_number: data.solution_number,
        solution_code: data.solution_code,
        extension_code: data.extension_code,
        supplier_name: data.supplier_name,
        wall_thickness: data.wall_thickness,
        structure_width: data.structure_width,
        fire_test_report_code: data.fire_test_report_code,
        catalog_page: data.catalog_page,
        curvature_radius: data.curvature_radius,
        curvature_radius_description: data.curvature_radius_description,
        break_resistance: data.break_resistance,
        break_resistance_report_code: data.break_resistance_report_code,
        break_resistance_notes: data.break_resistance_notes,
      })
      .select()
      .single();

    if (certError) throw certError;

    // 2. Save certified materials
    if (data.materials.length > 0) {
      const materialsToInsert = data.materials.map(material => ({
        certification_id: certificationData.id,
        position_type: material.position_type,
        position_side: material.position_side,
        material_description: material.material_description,
        material_code: material.material_code,
        thickness: material.thickness,
        specifications: material.specifications,
        position_order: material.position_order || 1,
      }));

      const { error: materialsError } = await supabase
        .from('certified_stratigraphy_materials')
        .insert(materialsToInsert);

      if (materialsError) throw materialsError;
    }

    // 3. Calculate totals for stratigraphy from layers data
    const totalThickness = data.layers?.reduce((sum, layer) => sum + (layer.thickness || 0), 0) || 0;
    
    // Calculate estimated cost and weight using layers (with screws)
    let estimatedCost = 0;
    let estimatedWeight = 0;

    // Create layers data for database insertion
    const layersForDatabase = data.layers?.map((layer, index) => {
      // Calculate costs from the layer system
      const layerMaterialCost = layer.material ? (
        layer.material.category === 'structure_frame' ? 
          (layer.material.incidence_base || layer.material.incidence_per_sqm || 1) * (600 / (layer.interAxis || 600)) * layer.material.unit_price :
        layer.material.category === 'structure_guide' ?
          (layer.material.incidence_per_sqm || 1) * layer.material.unit_price :
          (layer.material.incidence_per_sqm || 1) * layer.material.unit_price
      ) : 0;
      
      const layerScrewCost = layer.screwCostPerSqm || 0;
      const totalLayerCost = layerMaterialCost + layerScrewCost;
      
      estimatedCost += totalLayerCost;
      
      if (layer.material) {
        const layerWeight = (layer.material.weight_per_sqm || 0) * (layer.material.incidence_per_sqm || 1);
        estimatedWeight += layerWeight;
      }

      return {
        material_id: layer.materialId,
        thickness: layer.thickness || 10,
        position: index + 1,
        inter_axis: layer.interAxis,
        // Integrated screw data from the layer system
        screw_material_id: layer.screwMaterialId || null,
        screw_quantity: layer.screwQuantity || null,
        screw_cost_per_sqm: layer.screwCostPerSqm || null
      };
    }).filter(layer => layer.material_id) || [];

    // 4. Create the stratigraphy
    const { data: stratigraphyData, error: stratigraphyError } = await supabase
      .from('stratigraphies')
      .insert({
        name: data.name,
        description: data.description,
        type: data.type,
        total_thickness: totalThickness,
        is_certified: true,
        certification_id: certificationData.id,
        acoustic_performance: data.acoustic_reduction,
        fire_resistance_class: data.fire_resistance,
        cost_per_sqm: estimatedCost > 0 ? Math.round(estimatedCost * 100) / 100 : null,
        weight_per_sqm: estimatedWeight > 0 ? Math.round(estimatedWeight * 100) / 100 : null,
        // Add the comprehensive cost fields from the data
        material_cost_per_sqm: (data as any).materialCost || 0,
        screw_cost_per_sqm: (data as any).screwCost || 0,
        labor_cost_per_sqm: (data as any).laborCost || 0,
        comprehensive_cost_per_sqm: (data as any).totalCost || 0,
        installation_time_per_sqm: (data as any).installationTime || 0,
      })
      .select()
      .single();

    if (stratigraphyError) throw stratigraphyError;

    // 5. Create layers for the stratigraphy with integrated screw support
    if (layersForDatabase.length > 0) {
      const layersToInsert = layersForDatabase.map(layer => ({
        stratigraphy_id: stratigraphyData.id,
        material_id: layer.material_id,
        thickness: layer.thickness,
        position: layer.position,
        inter_axis: layer.inter_axis,
        // Integrated screw fields
        screw_material_id: layer.screw_material_id,
        screw_quantity: layer.screw_quantity,
        screw_cost_per_sqm: layer.screw_cost_per_sqm,
      }));

      const { error: layersError } = await supabase
        .from('layers')
        .insert(layersToInsert);

      if (layersError) {
        console.error('Error creating layers:', layersError);
        // Don't throw here, as the stratigraphy is already created
      }
    }

    toast.success('Stratigrafia certificata creata con successo!');
    
    // Don't redirect - just reset the form or stay on the page
    // If provided, notify selection of new stratigraphy
    if (onStratigraphySelect) {
      onStratigraphySelect(stratigraphyData.id);
    }
  };

  const updateCertifiedStratigraphy = async (data: CertifiedStratigraphySaveData) => {
    const certificationId = editingStratigraphy.stratigraphy.certification_id;
    const stratigraphyId = editingStratigraphy.stratigraphy.id;

    // 1. Update the certification
    const { error: certError } = await supabase
      .from('certifications')
      .update({
        name: data.name,
        value: data.fire_resistance,
        acoustic_reduction: data.acoustic_reduction,
        acoustic_report_code: data.acoustic_report_code,
        max_height: data.max_height,
        solution_number: data.solution_number,
        solution_code: data.solution_code,
        extension_code: data.extension_code,
        supplier_name: data.supplier_name,
        wall_thickness: data.wall_thickness,
        structure_width: data.structure_width,
        fire_test_report_code: data.fire_test_report_code,
        catalog_page: data.catalog_page,
        curvature_radius: data.curvature_radius,
        curvature_radius_description: data.curvature_radius_description,
        break_resistance: data.break_resistance,
        break_resistance_report_code: data.break_resistance_report_code,
        break_resistance_notes: data.break_resistance_notes,
      })
      .eq('id', certificationId);

    if (certError) throw certError;

    // 2. Update certified materials - delete and recreate
    await supabase
      .from('certified_stratigraphy_materials')
      .delete()
      .eq('certification_id', certificationId);

    if (data.materials.length > 0) {
      const materialsToInsert = data.materials.map(material => ({
        certification_id: certificationId,
        position_type: material.position_type,
        position_side: material.position_side,
        material_description: material.material_description,
        material_code: material.material_code,
        thickness: material.thickness,
        specifications: material.specifications,
        position_order: material.position_order || 1,
      }));

      const { error: materialsError } = await supabase
        .from('certified_stratigraphy_materials')
        .insert(materialsToInsert);

      if (materialsError) throw materialsError;
    }

    // 3. Update the stratigraphy
    const totalThickness = data.layers?.reduce((sum, layer) => sum + (layer.thickness || 0), 0) || 0;
    let estimatedWeight = 0;

    data.layers?.forEach(layer => {
      if (layer.material) {
        const layerWeight = (layer.material.weight_per_sqm || 0) * (layer.material.incidence_per_sqm || 1);
        estimatedWeight += layerWeight;
      }
    });

    const { error: stratigraphyError } = await supabase
      .from('stratigraphies')
      .update({
        name: data.name,
        description: data.description,
        type: data.type,
        total_thickness: totalThickness,
        acoustic_performance: data.acoustic_reduction,
        fire_resistance_class: data.fire_resistance,
        weight_per_sqm: estimatedWeight > 0 ? Math.round(estimatedWeight * 100) / 100 : null,
        // Add the comprehensive cost fields from the data
        material_cost_per_sqm: (data as any).materialCost || 0,
        screw_cost_per_sqm: (data as any).screwCost || 0,
        labor_cost_per_sqm: (data as any).laborCost || 0,
        comprehensive_cost_per_sqm: (data as any).totalCost || 0,
        installation_time_per_sqm: (data as any).installationTime || 0,
        cost_per_sqm: (data as any).totalCost || 0,
      })
      .eq('id', stratigraphyId);

    if (stratigraphyError) throw stratigraphyError;

    // 4. Update layers - delete and recreate
    await supabase
      .from('layers')
      .delete()
      .eq('stratigraphy_id', stratigraphyId);

    if (data.layers && data.layers.length > 0) {
      const layersToInsert = data.layers.map((layer, index) => ({
        stratigraphy_id: stratigraphyId,
        material_id: layer.materialId,
        thickness: layer.thickness,
        position: index + 1,
        inter_axis: layer.interAxis,
        // Integrated screw fields
        screw_material_id: layer.screwMaterialId || null,
        screw_quantity: layer.screwQuantity || null,
        screw_cost_per_sqm: layer.screwCostPerSqm || null,
      }));

      const { error: layersError } = await supabase
        .from('layers')
        .insert(layersToInsert);

      if (layersError) throw layersError;
    }

    toast.success('Stratigrafia certificata aggiornata con successo!');
    
    // Navigate back to the configurator without the edit parameter
    navigate('/configurator?tab=certified');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {isEditMode ? <Edit className="h-6 w-6 text-blue-600" /> : <ShieldCheck className="h-6 w-6 text-green-600" />}
        <h2 className="text-2xl font-bold">
          {isEditMode ? 'Modifica Stratigrafia Certificata' : 'Inserisci Nuova Stratigrafia Certificata'}
        </h2>
      </div>
      
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Stai modificando la stratigrafia certificata: <strong>{editingStratigraphy.stratigraphy.name}</strong>
          </p>
        </div>
      )}
      
      <CertifiedStratigraphyForm 
        onSave={handleSaveCertifiedStratigraphy}
        isSaving={isSaving}
        editingStratigraphy={editingStratigraphy}
      />
    </div>
  );
};

export default CertifiedStratigraphyTab;
