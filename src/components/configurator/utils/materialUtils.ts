
import { DatabaseMaterial } from '@/hooks/useMaterials';

// Verifica se un materiale ha spessore variabile
export const hasVariableThickness = (material?: DatabaseMaterial): boolean => {
  // La proprietà è is_variable_thickness, presente anche su 'other'
  return !!material?.is_variable_thickness;
};

// Ottiene lo spessore di default per un materiale
export const getDefaultThickness = (material?: DatabaseMaterial): number => {
  if (!material) return 0;

  // Se il materiale ha uno spessore fisso nella tabella, usalo
  if (material.thickness !== null && material.thickness !== undefined) {
    return material.thickness;
  }

  // Solo per materiali a spessore variabile (qualsiasi categoria), usa un valore di default
  if (material.is_variable_thickness) {
    return 50; // 50mm come default
  }

  // Fallback per casi non previsti
  return 10;
};

// Verifica se lo spessore di un layer può essere modificato
export const canEditThickness = (material?: DatabaseMaterial): boolean => {
  return hasVariableThickness(material);
};

