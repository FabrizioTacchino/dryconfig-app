import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaterialCategory } from '@/types';
import { categories, MaterialFormData } from './forms/MaterialFormData';
import { useMaterialSubmit } from './hooks/useMaterialSubmit';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import BoardMaterialForm from './forms/BoardMaterialForm';
import FrameMaterialForm from './forms/FrameMaterialForm';
import GuideMaterialForm from './forms/GuideMaterialForm';
import OtherMaterialForm from './forms/OtherMaterialForm';
import ScrewMaterialForm from './forms/ScrewMaterialForm';
import InsulationMaterialForm from './forms/InsulationMaterialForm';
import AccessoryMaterialFormEdit from './forms/AccessoryMaterialFormEdit';

interface EditMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  material: DatabaseMaterial;
}

const EditMaterialDialog = ({ open, onOpenChange, onSuccess, material }: EditMaterialDialogProps) => {
  const [formData, setFormData] = useState<MaterialFormData>({
    code: '',
    name: '',
    description: '',
    category: 'board' as MaterialCategory,
    supplier: '',
    thickness: '',
    width: '',
    length: '',
    weight_per_sqm: '',
    unit_price: '',
    unit: 'mq',
    thermal_conductivity: '',
    acoustic_performance: '',
    fire_resistance_class: '',
    color_hex: '#CCCCCC',
    incidence_base: '',
    incidence_per_sqm: '1',
    passo: '600',
    installation_time_per_sqm: '',
    material_type: 'gesso_rivestito',
    board_typology: 'standard',
    density: '',
    flexural_strength: '',
    surface_hardness: '',
    en_520_type: '',
    water_absorption: '',
    humidity_resistance_class: '',
    environmental_certification: '',
    recycled_content: '',
    voc_class: '',
    rei_compatible: 'false',
    intended_use: '',
    installation_notes: '',
    fire_class: '',
    fire_description: '',
    board_type: '',
    fire_usage_notes: '',
    sheet_thickness: '0.6',
    weight_per_ml: '',
    profile_type: 'C',
    surface_finish: 'zincatura_z140',
    discount: '',
    extra_discount: '0',
    list_price: '',
    is_variable_thickness: false,
    mechanical_performance: '',
    thermal_performance_notes: '',
    sustainability_notes: '',
    system_compatibility: '',
    fire_performance_notes: '',
    carbon_footprint: '',
    epd: '',
    vapor_permeability: '',
    thermal_capacity: '',
    box_pieces: '',
    compatible_board_types: '',
    waste_percentage: '10',
    disposal_percentage: '4',
  });
  
  const { submitMaterial, isSubmitting } = useMaterialSubmit(onOpenChange, onSuccess);
  // Il calcolo unit_price ora vive in MaterialPricingSection: list_price × catena famiglia × (1 - extra/100).

  // Popola form con campo installation_time_per_sqm quando dialog apre
  useEffect(() => {
    if (material && open) {
      setFormData({
        code: material.code || '',
        name: material.name || '',
        description: material.description || '',
        category: material.category as MaterialCategory,
        supplier: material.supplier || '',
        thickness: material.thickness?.toString() || '',
        width: material.width?.toString() || '',
        length: material.length?.toString() || '',
        weight_per_sqm: material.weight_per_sqm?.toString() || '',
        unit_price: material.unit_price?.toString() || '',
        unit: material.unit || 'mq',
        thermal_conductivity: material.thermal_conductivity?.toString() || '',
        acoustic_performance: material.acoustic_performance?.toString() || '',
        fire_resistance_class: material.fire_resistance_class || '',
        color_hex: material.color_hex || '#CCCCCC',
        incidence_base: material.incidence_base?.toString() || '',
        incidence_per_sqm: material.incidence_per_sqm?.toString() || '1',
        passo: material.passo?.toString() || '600',
        installation_time_per_sqm: material.installation_time_per_sqm?.toString() || '',
        material_type: material.material_type || 'gesso_rivestito',
        board_typology: material.board_typology || 'standard',
        density: material.density?.toString() || '',
        flexural_strength: material.flexural_strength || '',
        surface_hardness: material.surface_hardness || '',
        en_520_type: material.en_520_type || '',
        water_absorption: material.water_absorption || '',
        humidity_resistance_class: material.humidity_resistance_class || '',
        environmental_certification: material.environmental_certification || '',
        recycled_content: material.recycled_content?.toString() || '',
        voc_class: material.voc_class || '',
        rei_compatible: material.rei_compatible?.toString() || 'false',
        intended_use: Array.isArray(material.intended_use) ? material.intended_use.join(', ') : (material.intended_use || ''),
        installation_notes: material.installation_notes || '',
        fire_class: material.fire_class || '',
        fire_description: material.fire_description || '',
        board_type: material.board_type || '',
        fire_usage_notes: material.fire_usage_notes || '',
        sheet_thickness: material.sheet_thickness?.toString() || '0.6',
        weight_per_ml: material.weight_per_ml?.toString() || '',
        profile_type: material.profile_type || 'C',
        surface_finish: material.surface_finish || 'zincatura_z140',
        discount: material.discount != null ? material.discount.toString() : '',
        extra_discount: material.extra_discount != null ? material.extra_discount.toString() : '0',
        family_discount_chain_display:
          Array.isArray(material.family_discount_chain) && material.family_discount_chain.length > 0
            ? material.family_discount_chain.map(d => `${d}%`).join(' + ')
            : '',
        family_discount_pct_display: material.family_discount_pct != null ? String(material.family_discount_pct) : '0',
        total_discount_pct_display: material.total_discount_pct != null ? String(material.total_discount_pct) : '0',
        list_price: material.list_price != null ? material.list_price.toString() : (material.unit_price?.toString() || ''),
        is_variable_thickness: material.is_variable_thickness ?? false,
        mechanical_performance: material.mechanical_performance || '',
        thermal_performance_notes: material.thermal_performance_notes || '',
        sustainability_notes: material.sustainability_notes || '',
        system_compatibility: material.system_compatibility || '',
        fire_performance_notes: material.fire_performance_notes || '',
        carbon_footprint: material.carbon_footprint || '',
        epd: material.epd || '',
        vapor_permeability: material.vapor_permeability || '',
        thermal_capacity: material.thermal_capacity || '',
        box_pieces: material.box_pieces != null ? material.box_pieces.toString() : '',
        compatible_board_types: 
          Array.isArray(material.compatible_board_types)
            ? material.compatible_board_types.join(', ')
            : (material.compatible_board_types || ''),
        waste_percentage: material.waste_percentage?.toString() || '10',
        disposal_percentage: material.disposal_percentage?.toString() || '4',
      });
    }
  }, [material, open]);

  const handleCategoryChange = (category: MaterialCategory) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Create a copy of formData with id added for update
    const materialData = { ...formData, id: material.id };
    await submitMaterial(materialData);
  };

  const renderCategoryForm = () => {
    switch (formData.category) {
      case 'board':
        return (
          <BoardMaterialForm 
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      case 'structure_frame':
        return (
          <FrameMaterialForm 
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      case 'structure_guide':
        return (
          <GuideMaterialForm 
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      case 'insulation':
        return (
          <InsulationMaterialForm 
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      case 'accessory':
        return (
          <AccessoryMaterialFormEdit 
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      case 'screw':
        return (
          <ScrewMaterialForm
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      case 'other':
        return (
          <OtherMaterialForm 
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return (
          <div className="text-muted-foreground p-8 text-center">
            Categoria non supportata per la modifica
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Materiale</DialogTitle>
          <DialogDescription>
            Modifica le informazioni del materiale "{material?.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selezione Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categoria Materiale</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 border border-input rounded-md"
                disabled={isSubmitting}
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Form specifico per categoria */}
          {renderCategoryForm()}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salva Modifiche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMaterialDialog;
