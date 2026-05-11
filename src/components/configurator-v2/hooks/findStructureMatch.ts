import type { DatabaseMaterial } from '@/hooks/useMaterials';

/**
 * Trova il materiale "abbinato" a un montante/guida nel catalogo.
 *
 * Chiave di abbinamento (in ordine di priorità):
 *   1. Stesso `width` + stesso `supplier` + stessa `sheet_thickness`
 *   2. Stesso `width` + stesso `supplier`
 *   3. Stesso `width` qualsiasi supplier
 *   4. null (no match)
 *
 * Tra i candidati, sceglie quello con maggiore similarità di nome.
 */

function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const aw = a.toLowerCase().split(/\s|-|\//);
  const bw = b.toLowerCase().split(/\s|-|\//);
  let score = 0;
  for (const w of aw) if (w.length >= 3 && bw.includes(w)) score++;
  return score;
}

export function findStructureMatch(
  selectedMaterial: DatabaseMaterial,
  catalog: DatabaseMaterial[],
  targetCategory: 'structure_frame' | 'structure_guide',
): DatabaseMaterial | null {
  const selWidth = selectedMaterial.width ?? null;
  const selSheet = selectedMaterial.sheet_thickness ?? null;
  const selSupplier = selectedMaterial.supplier;
  if (selWidth == null) return null;

  const sameCategory = (m: DatabaseMaterial) => m.category === targetCategory;
  const sameWidth = (m: DatabaseMaterial) => m.width != null && Number(m.width) === Number(selWidth);
  const sameSheet = (m: DatabaseMaterial) =>
    selSheet != null && m.sheet_thickness != null && Number(m.sheet_thickness) === Number(selSheet);
  const sameSupplier = (m: DatabaseMaterial) => m.supplier === selSupplier;

  // 1) Width + supplier + sheet
  let pool = catalog.filter(m => sameCategory(m) && sameWidth(m) && sameSupplier(m) && sameSheet(m));
  // 2) Width + supplier
  if (pool.length === 0) pool = catalog.filter(m => sameCategory(m) && sameWidth(m) && sameSupplier(m));
  // 3) Width any supplier
  if (pool.length === 0) pool = catalog.filter(m => sameCategory(m) && sameWidth(m));
  if (pool.length === 0) return null;

  pool.sort((a, b) => nameSimilarity(b.name, selectedMaterial.name) - nameSimilarity(a.name, selectedMaterial.name));
  return pool[0];
}

/**
 * Categoria opposta in coppia montante/guida.
 */
export function oppositeStructureCategory(c: 'structure_frame' | 'structure_guide'): 'structure_frame' | 'structure_guide' {
  return c === 'structure_frame' ? 'structure_guide' : 'structure_frame';
}
