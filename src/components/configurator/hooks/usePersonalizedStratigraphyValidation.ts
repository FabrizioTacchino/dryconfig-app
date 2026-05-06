
import { useMemo } from 'react';
import { Layer } from '../types/StratigraphyTypes';

interface PersonalizedStratigraphyFormData {
  name: string;
  description: string;
  type: string;
}

interface UsePersonalizedStratigraphyValidationProps {
  formData: PersonalizedStratigraphyFormData;
  layers: Layer[];
}

export const usePersonalizedStratigraphyValidation = (
  formData: PersonalizedStratigraphyFormData,
  layers: Layer[]
) => {
  const isNameValid = useMemo(() => {
    return formData.name.trim().length > 0;
  }, [formData.name]);

  const hasValidLayers = useMemo(() => {
    // NEW: Validazione semplificata per sistema integrato
    // Un layer è valido se ha un materiale e uno spessore > 0
    return layers.some(layer => {
      return layer.materialId && 
             typeof layer.thickness === 'number' && 
             layer.thickness > 0;
    });
  }, [layers]);

  const isFormValid = useMemo(() => {
    return isNameValid && hasValidLayers;
  }, [isNameValid, hasValidLayers]);

  console.log('[usePersonalizedStratigraphyValidation] 🔄 INTEGRATED VALIDATION:', {
    isNameValid,
    hasValidLayers,
    totalLayers: layers.length,
    layersWithScrews: layers.filter(l => l.screwMaterialId).length,
    validLayers: layers.filter(l => l.materialId && l.thickness > 0).length
  });

  return {
    isNameValid,
    hasValidLayers,
    isFormValid
  };
};
