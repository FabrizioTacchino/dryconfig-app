
import React, { useState } from 'react';
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
import { categories, initialFormData, MaterialFormData } from './forms/MaterialFormData';
import { useMaterialSubmit } from './hooks/useMaterialSubmit';
import BoardMaterialForm from './forms/BoardMaterialForm';
import FrameMaterialForm from './forms/FrameMaterialForm';
import GuideMaterialForm from './forms/GuideMaterialForm';
import InsulationMaterialForm from './forms/InsulationMaterialForm';
import OtherMaterialForm from './forms/OtherMaterialForm';
import ScrewMaterialForm from './forms/ScrewMaterialForm';
import { getInitialFormDataForCategory } from './forms/MaterialFormData';

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateMaterialDialog = ({ open, onOpenChange, onSuccess }: CreateMaterialDialogProps) => {
  const [formData, setFormData] = useState<MaterialFormData>(initialFormData);

  const { submitMaterial, isSubmitting } = useMaterialSubmit(onOpenChange, onSuccess);

  // Al cambio categoria, reset anche list_price!
  const handleCategoryChange = (category: MaterialCategory) => {
    const categoryDefaults = getInitialFormDataForCategory(category);
    setFormData(prev => ({
      ...prev,
      category,
      list_price: '', // reset prezzo listino su cambio categoria
      ...categoryDefaults
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMaterial(formData);
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
      case 'screw':
        return (
          <ScrewMaterialForm
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      case 'accessory':
      case 'other':
        return (
          <OtherMaterialForm 
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return <div className="text-muted-foreground p-8 text-center">Seleziona una categoria per continuare</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Materiale</DialogTitle>
          <DialogDescription>
            Aggiungi un nuovo materiale al catalogo
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
              {isSubmitting ? 'Creazione...' : 'Crea Materiale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default CreateMaterialDialog;
