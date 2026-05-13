import type { EstimateStatus } from '@/types';

/**
 * F30 — Stati "chiusi" del preventivo: nessuna modifica sostanziale ammessa
 * (no add/remove stratigrafie, no bulk refresh prezzi, no edit prezzi snapshot).
 *
 * - `won` / `lost` sono i due esiti finali del nuovo workflow.
 * - `contracted` è legacy pre-F30 ed equivale (di fatto) a `won`: lo manteniamo
 *   nel set chiusi per non sbloccare preventivi storici non ancora migrati lato
 *   UI.
 */
export function isEstimateLocked(status: EstimateStatus | string | null | undefined): boolean {
  return status === 'won' || status === 'lost' || status === 'contracted';
}

/** Etichetta breve dello stato chiuso (per messaggi di blocco / badge). */
export function lockedStateLabel(status: EstimateStatus | string | null | undefined): string {
  if (status === 'won' || status === 'contracted') return 'Vinto';
  if (status === 'lost') return 'Perso';
  return 'Chiuso';
}
