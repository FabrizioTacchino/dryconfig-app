
import { useState } from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';

// Algoritmo di similarità semplice (match nomi simili per primo)
function nameSimilarity(a: string, b: string) {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 3;
  if (a.includes(b) || b.includes(a)) return 2;
  // punteggio se condividono almeno una parola
  const aWords = a.split(/\s|-/);
  const bWords = b.split(/\s|-/);
  if (aWords.some(word => bWords.includes(word))) return 1;
  return 0;
}

export interface StructureSuggestion {
  type: 'montanti' | 'guide';
  suggestedMaterial: DatabaseMaterial;
  currentLayer: any;
}

export const useAutoSuggestStructure = () => {
  const [suggestion, setSuggestion] = useState<StructureSuggestion | null>(null);

  // Nuovo: filtro per stesso spessore, fornitore e priorità nome simile
  const findCompatibleMaterial = (
    selectedMaterial: DatabaseMaterial,
    materials: DatabaseMaterial[],
    targetCategory: 'structure_frame' | 'structure_guide'
  ): DatabaseMaterial | null => {
    if (!selectedMaterial.thickness) return null;
    // PRIMA SCELTA: stesso fornitore E stesso spessore
    let candidates = materials.filter(
      material =>
        material.category === targetCategory &&
        material.supplier === selectedMaterial.supplier &&
        material.thickness === selectedMaterial.thickness
    );
    // Se ce ne sono più di uno: ordina per similarità nomi rispetto al materiale selezionato
    if (candidates.length) {
      candidates.sort((a, b) =>
        nameSimilarity(b.name, selectedMaterial.name) - nameSimilarity(a.name, selectedMaterial.name)
      );
      return candidates[0];
    }

    // SECONDA SCELTA: qualsiasi fornitore, stesso spessore
    candidates = materials.filter(
      material =>
        material.category === targetCategory &&
        material.thickness === selectedMaterial.thickness
    );
    if (candidates.length) {
      candidates.sort((a, b) =>
        (a.supplier === selectedMaterial.supplier ? -1 : 1) +
        (nameSimilarity(b.name, selectedMaterial.name) - nameSimilarity(a.name, selectedMaterial.name))
      );
      return candidates[0];
    }

    // Ultima scelta: niente suggerimento se non c'è compatibilità di spessore
    return null;
  };

  const checkForSuggestion = (
    selectedMaterial: DatabaseMaterial,
    availableMaterials: DatabaseMaterial[],
    currentLayer: any,
    layers: any[]
  ) => {
    if (!selectedMaterial || !selectedMaterial.thickness) return;

    // Seleziono montante: suggerisco la guida se montanti > guide
    if (selectedMaterial.category === 'structure_frame') {
      const countMontanti = layers.filter(layer =>
        layer.material?.category === 'structure_frame' &&
        layer.material?.supplier === selectedMaterial.supplier &&
        layer.material?.thickness === selectedMaterial.thickness
      ).length;
      const countGuides = layers.filter(layer =>
        layer.material?.category === 'structure_guide' &&
        layer.material?.supplier === selectedMaterial.supplier &&
        layer.material?.thickness === selectedMaterial.thickness
      ).length;
      
      if (countMontanti > countGuides) {
        const suggestedGuide = findCompatibleMaterial(
          selectedMaterial,
          availableMaterials,
          'structure_guide'
        );
        if (suggestedGuide) {
          setSuggestion({
            type: 'guide',
            suggestedMaterial: suggestedGuide,
            currentLayer
          });
        }
      }
    }

    // Seleziono guida: suggerisco il montante se guide > montanti
    if (selectedMaterial.category === 'structure_guide') {
      const countMontanti = layers.filter(layer =>
        layer.material?.category === 'structure_frame' &&
        layer.material?.supplier === selectedMaterial.supplier &&
        layer.material?.thickness === selectedMaterial.thickness
      ).length;
      const countGuides = layers.filter(layer =>
        layer.material?.category === 'structure_guide' &&
        layer.material?.supplier === selectedMaterial.supplier &&
        layer.material?.thickness === selectedMaterial.thickness
      ).length;
      
      if (countGuides > countMontanti) {
        const suggestedMontante = findCompatibleMaterial(
          selectedMaterial,
          availableMaterials,
          'structure_frame'
        );
        if (suggestedMontante) {
          setSuggestion({
            type: 'montanti',
            suggestedMaterial: suggestedMontante,
            currentLayer
          });
        }
      }
    }
  };

  const clearSuggestion = () => setSuggestion(null);

  return {
    suggestion,
    checkForSuggestion,
    clearSuggestion
  };
};
