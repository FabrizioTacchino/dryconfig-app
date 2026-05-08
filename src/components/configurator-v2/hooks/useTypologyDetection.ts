import { useMemo } from 'react';
import type { LayerV2, StratigraphyTypology } from '../types';

/**
 * Rileva la tipologia di stratigrafia in base alla disposizione dei layer.
 *
 * Regole semplici:
 *  - Se ci sono layer board sia prima sia dopo un layer structure_frame → `partition`
 *  - Se ci sono layer board ma solo da un lato della struttura → `lining`
 *  - Se ci sono SOLO layer ceiling_tile o structure_frame senza board sotto-struttura → `ceiling`
 *  - Altrimenti `unknown`
 */
export function useTypologyDetection(layers: LayerV2[]): StratigraphyTypology {
  return useMemo(() => detectTypology(layers), [layers]);
}

export function detectTypology(layers: LayerV2[]): StratigraphyTypology {
  const cats = layers.map(l => l.material?.category).filter(Boolean) as string[];
  if (cats.length === 0) return 'unknown';

  // Controsoffitto: ceiling_tile o structure_frame come primo elemento senza board sotto
  if (cats.some(c => c === 'ceiling_tile')) return 'ceiling';

  // Trova il primo indice di structure_frame
  const structureIdx = cats.findIndex(c => c === 'structure_frame');
  if (structureIdx === -1) {
    // Niente struttura: se solo lastre/isolanti, di solito è una controparete
    return cats.includes('board') ? 'lining' : 'unknown';
  }

  const before = cats.slice(0, structureIdx);
  const after = cats.slice(structureIdx + 1);
  const boardsBefore = before.filter(c => c === 'board').length;
  const boardsAfter = after.filter(c => c === 'board').length;

  if (boardsBefore > 0 && boardsAfter > 0) return 'partition';
  if (boardsBefore > 0 || boardsAfter > 0) return 'lining';
  return 'unknown';
}

export function typologyLabel(t: StratigraphyTypology): string {
  switch (t) {
    case 'partition': return 'Parete divisoria';
    case 'lining': return 'Controparete';
    case 'ceiling': return 'Controsoffitto';
    default: return '—';
  }
}
