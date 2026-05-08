import { useMemo } from 'react';
import type { LayerV2, StratigraphyTypology } from '../types';

/**
 * Genera il codice sistema DryConfig in stile Knauf W11x.
 *
 * Pattern: `DC-{TIPO}{N}-{N_LASTRE_A}L+{N_LASTRE_B}L-{SEZ_MONT}[-RW{rw}][-EI{ei}]`
 *
 *   parete 1+1 lastra 12.5, montante 75       → DC-W111-1L+1L-75
 *   parete 2+2 lastre 12.5, montante 75, lana → DC-W112-2L+2L-75
 *   controparete 1 lastra 12.5, montante 50   → DC-LIN111-1L-50
 *   controsoffitto 1 lastra, orditura 27/48   → DC-D111-1L-48
 *   stratigrafia incompleta/anomala           → DC-CUSTOM
 *
 * Vedi `docs/mockupui.md` §18.
 */
export interface SystemCodeInput {
  typology: StratigraphyTypology;
  layers: LayerV2[];
  rw?: number | null;  // futuro
  ei?: number | null;  // futuro
}

export function useSystemCode(input: SystemCodeInput): string {
  return useMemo(() => generateSystemCode(input), [
    input.typology,
    input.layers,
    input.rw,
    input.ei,
  ]);
}

export function generateSystemCode({ typology, layers, rw, ei }: SystemCodeInput): string {
  if (layers.length === 0 || typology === 'unknown') return 'DC-CUSTOM';

  const prefix = typology === 'partition' ? 'W' : typology === 'lining' ? 'LIN' : 'D';

  // Trova la struttura principale (primo structure_frame)
  const structureIdx = layers.findIndex(l => l.material?.category === 'structure_frame');
  const structure = structureIdx >= 0 ? layers[structureIdx] : null;
  const structureWidth = structure?.material?.width ?? null;

  // Conta lastre prima e dopo la struttura
  let boardsA = 0;
  let boardsB = 0;
  layers.forEach((l, i) => {
    if (l.material?.category !== 'board') return;
    if (structureIdx === -1 || i < structureIdx) boardsA++;
    else boardsB++;
  });

  // Famiglia: 11 (singola orditura) — distinguiamo solo dal numero di lastre per ora.
  // Doppia orditura (W115/W118) detectabile da 2+ structure_frame: futuro.
  const family = boardsA + boardsB > 0 ? `1${Math.min(2, Math.max(boardsA, boardsB))}` : '11';

  const parts: string[] = [`DC-${prefix}${family}`];

  if (typology === 'partition' && (boardsA + boardsB) > 0) {
    parts.push(`${boardsA}L+${boardsB}L`);
  } else if (boardsA + boardsB > 0) {
    parts.push(`${boardsA + boardsB}L`);
  }

  if (structureWidth) {
    parts.push(String(Math.round(Number(structureWidth))));
  }

  if (typeof rw === 'number' && rw > 0) parts.push(`RW${Math.round(rw)}`);
  if (typeof ei === 'number' && ei > 0) parts.push(`EI${Math.round(ei)}`);

  return parts.join('-');
}
