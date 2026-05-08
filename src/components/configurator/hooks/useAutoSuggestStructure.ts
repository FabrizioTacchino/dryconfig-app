import { useState } from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';

/**
 * Suggerimento intelligente montante ↔ guida.
 *
 * Chiave di abbinamento (in ordine di priorità):
 *   1. Stesso `width` (sezione mm es. 50/75/100), stesso `supplier`, stessa `sheet_thickness`
 *   2. Stesso `width` + stesso `supplier` (qualsiasi lamiera)
 *   3. Stesso `width` qualsiasi supplier
 *   4. Niente (no suggerimento)
 *
 * Nota: il vecchio matching usava material.thickness, ma sui profili Saint-Gobain
 * thickness è NULL — la sezione del profilo è in `width`.
 */

function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const aw = a.toLowerCase().split(/\s|-|\//);
  const bw = b.toLowerCase().split(/\s|-|\//);
  let score = 0;
  for (const w of aw) if (w.length >= 3 && bw.includes(w)) score++;
  return score;
}

export interface StructureSuggestion {
  type: 'montanti' | 'guide';
  suggestedMaterial: DatabaseMaterial;
  currentLayer: any;
}

export const useAutoSuggestStructure = () => {
  const [suggestion, setSuggestion] = useState<StructureSuggestion | null>(null);

  const findCompatibleMaterial = (
    selectedMaterial: DatabaseMaterial,
    materials: DatabaseMaterial[],
    targetCategory: 'structure_frame' | 'structure_guide',
  ): DatabaseMaterial | null => {
    const selWidth = selectedMaterial.width ?? null;
    const selSheet = selectedMaterial.sheet_thickness ?? null;
    const selSupplier = selectedMaterial.supplier;

    if (selWidth == null) return null;

    const sameCategory = (m: DatabaseMaterial) => m.category === targetCategory && m.is_active !== false;
    const sameWidth = (m: DatabaseMaterial) => m.width != null && Number(m.width) === Number(selWidth);
    const sameSheet = (m: DatabaseMaterial) =>
      selSheet != null && m.sheet_thickness != null && Number(m.sheet_thickness) === Number(selSheet);
    const sameSupplier = (m: DatabaseMaterial) => m.supplier === selSupplier;

    // 1) Width + supplier + sheet
    let pool = materials.filter(m => sameCategory(m) && sameWidth(m) && sameSupplier(m) && sameSheet(m));
    // 2) Width + supplier
    if (pool.length === 0)
      pool = materials.filter(m => sameCategory(m) && sameWidth(m) && sameSupplier(m));
    // 3) Width any supplier
    if (pool.length === 0)
      pool = materials.filter(m => sameCategory(m) && sameWidth(m));
    if (pool.length === 0) return null;

    // Tra i candidati: ordina per similarità nome → primo è il più "abbinato"
    pool.sort((a, b) => nameSimilarity(b.name, selectedMaterial.name) - nameSimilarity(a.name, selectedMaterial.name));
    return pool[0];
  };

  const checkForSuggestion = (
    selectedMaterial: DatabaseMaterial,
    availableMaterials: DatabaseMaterial[],
    currentLayer: any,
    layers: any[],
  ) => {
    if (!selectedMaterial) return;
    if (selectedMaterial.width == null) return; // serve la sezione per matchare
    const w = Number(selectedMaterial.width);

    const sameWidth = (m: any) => Number(m?.material?.width ?? -1) === w;
    const supp = selectedMaterial.supplier;
    const sameSupplier = (m: any) => m?.material?.supplier === supp;

    if (selectedMaterial.category === 'structure_frame') {
      const countMontanti = layers.filter(l => l.material?.category === 'structure_frame' && sameWidth(l) && sameSupplier(l)).length;
      const countGuide    = layers.filter(l => l.material?.category === 'structure_guide'  && sameWidth(l) && sameSupplier(l)).length;
      if (countMontanti > countGuide) {
        const sg = findCompatibleMaterial(selectedMaterial, availableMaterials, 'structure_guide');
        if (sg) setSuggestion({ type: 'guide', suggestedMaterial: sg, currentLayer });
      }
    }

    if (selectedMaterial.category === 'structure_guide') {
      const countMontanti = layers.filter(l => l.material?.category === 'structure_frame' && sameWidth(l) && sameSupplier(l)).length;
      const countGuide    = layers.filter(l => l.material?.category === 'structure_guide'  && sameWidth(l) && sameSupplier(l)).length;
      if (countGuide > countMontanti) {
        const sm = findCompatibleMaterial(selectedMaterial, availableMaterials, 'structure_frame');
        if (sm) setSuggestion({ type: 'montanti', suggestedMaterial: sm, currentLayer });
      }
    }
  };

  const clearSuggestion = () => setSuggestion(null);

  return {
    suggestion,
    checkForSuggestion,
    clearSuggestion,
  };
};
