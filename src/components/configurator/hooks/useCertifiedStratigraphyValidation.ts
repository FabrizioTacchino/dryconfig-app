
import { useMemo } from 'react';
import { CertifiedStratigraphyFormData } from '@/types/certification';
import { MaterialCategory } from '@/types';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
}

export const useCertifiedStratigraphyValidation = (
  formData: CertifiedStratigraphyFormData,
  layers: Layer[]
) => {
  const validation = useMemo(() => {
    const isNameValid = formData.name.trim().length > 0;
    const hasValidLayers = layers.filter(layer => layer.materialId && layer.thickness > 0).length > 0;
    const isFormValid = isNameValid && formData.fire_resistance && formData.solution_number && hasValidLayers;

    return {
      isNameValid,
      hasValidLayers,
      isFormValid
    };
  }, [formData.name, formData.fire_resistance, formData.solution_number, layers]);

  return validation;
};
