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

  // Trova TUTTE le strutture (per distinguere singola da doppia orditura)
  const structureIndices = layers
    .map((l, i) => (l.material?.category === 'structure_frame' ? i : -1))
    .filter(i => i >= 0);
  const isDoubleStruct = structureIndices.length >= 2;
  const firstStructIdx = structureIndices[0] ?? -1;
  const lastStructIdx = structureIndices[structureIndices.length - 1] ?? -1;

  // Larghezze montanti (somma o singolo)
  const structureWidths = structureIndices.map(i => Number(layers[i].material?.width) || 0);

  // Conta lastre lato A (prima della prima struttura) e lato B (dopo l'ultima)
  let boardsA = 0;
  let boardsB = 0;
  layers.forEach((l, i) => {
    if (l.material?.category !== 'board') return;
    if (firstStructIdx === -1 || i < firstStructIdx) boardsA++;
    else if (i > lastStructIdx) boardsB++;
    // boards in mezzo a doppia struttura (raro): non contate qui
  });

  // Famiglia stile Knauf:
  //  - W111 = 1+1 lastra, singola orditura
  //  - W112 = 2+2 lastre, singola orditura
  //  - W115 = 2+2 lastre, doppia orditura (W115)
  //  - W118 = 3+3 lastre, doppia orditura
  let family: string;
  if (isDoubleStruct) {
    if (boardsA >= 3 && boardsB >= 3) family = '118';
    else family = '115';
  } else {
    family = boardsA + boardsB > 0 ? `1${Math.min(2, Math.max(boardsA, boardsB))}` : '11';
  }

  const parts: string[] = [`DC-${prefix}${family}`];

  if (typology === 'partition' && (boardsA + boardsB) > 0) {
    parts.push(`${boardsA}L+${boardsB}L`);
  } else if (boardsA + boardsB > 0) {
    parts.push(`${boardsA + boardsB}L`);
  }

  if (structureWidths.length > 0) {
    // Singola: "75". Doppia: "75+75" (o "75+50" se diverse).
    parts.push(structureWidths.map(w => Math.round(w)).join('+'));
  }

  if (typeof rw === 'number' && rw > 0) parts.push(`RW${Math.round(rw)}`);
  if (typeof ei === 'number' && ei > 0) parts.push(`EI${Math.round(ei)}`);

  return parts.join('-');
}
