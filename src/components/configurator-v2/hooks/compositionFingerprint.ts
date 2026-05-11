import type { LayerV2 } from '../types';

/**
 * Fingerprint di un singolo layer per il match composizionale fra
 * stratigrafie. Si concentra sulle proprietà tecniche rilevanti
 * (categoria, spessore, e per i montanti la larghezza), ignorando
 * brand/fornitore così che due lastre 12.5mm di marche diverse
 * matchino lo "scheletro" tecnico.
 */
export interface LayerFingerprint {
  category: string;
  /** Spessore arrotondato a 0.5mm. */
  thicknessMm: number;
  /** Solo per structure_frame: width arrotondata a 5mm. */
  studWidthMm?: number;
}

/**
 * Match score fra due composizioni. Non simmetrico se le lunghezze differiscono.
 *  - 1.0 = exact (stessa categoria, stesso spessore esatto, stessa width montante)
 *  - 0.8..0.99 = loose (spessore con tolleranza ±2mm o width montante diversa)
 *  - <0.8 = diverso
 */
export interface CompositionMatch {
  score: number;
  /** Lunghezze diverse → score 0 e issue impostato. */
  reason?: 'length_mismatch' | 'category_mismatch' | 'thickness_mismatch';
}

const STRUCTURE_THICKNESS_TOLERANCE_MM = 2;
const NON_STRUCTURE_THICKNESS_TOLERANCE_MM = 1;

/** Arrotonda a step di `step` mm. Restituisce 0 se v non è finito. */
function snap(v: number, step: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.round(v / step) * step;
}

/**
 * Calcola il fingerprint di un layer. Layer senza materialId/category
 * tornano category="empty" e sono ignorati dal matching (filter chiamante).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fingerprintLayer(layer: LayerV2 | any): LayerFingerprint {
  // Supporta sia forma V2 (camelCase) che DB-shape (snake_case con materials).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mat = (layer.material ?? layer.materials) as any;
  const category = String(mat?.category ?? 'empty');
  const thickness = Number(layer.thickness ?? 0);
  const fp: LayerFingerprint = {
    category,
    thicknessMm: snap(thickness, 0.5),
  };
  if (category === 'structure_frame') {
    const width = Number(mat?.width ?? 0);
    if (width > 0) fp.studWidthMm = snap(width, 5);
  }
  return fp;
}

/**
 * Costruisce il fingerprint dell'intera composizione, escludendo i layer
 * vuoti (no materialId / category=empty). L'ordine è preservato perché
 * la sequenza top→bottom è semanticamente significativa per la stratigrafia.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fingerprintComposition(layers: (LayerV2 | any)[]): LayerFingerprint[] {
  return layers
    .map(fingerprintLayer)
    .filter(fp => fp.category !== 'empty' && fp.category !== 'screw');
}

/**
 * Stringa serializzata del fingerprint, utile per cache key e log.
 * Esempio: "board:12.5|structure_frame:75[w75]|insulation:60|board:12.5"
 */
export function serializeFingerprint(fps: LayerFingerprint[]): string {
  return fps
    .map(fp => {
      const w = fp.studWidthMm ? `[w${fp.studWidthMm}]` : '';
      return `${fp.category}:${fp.thicknessMm}${w}`;
    })
    .join('|');
}

/**
 * Confronta due composizioni e ritorna uno score di similarità.
 *
 * Score:
 *  - 1.0 → stesso numero di layer + stessa categoria + stesso spessore esatto
 *           per ognuno (e stessa stud width se presente)
 *  - 0.8..0.99 → tolleranza spessori (±1mm non-strutture, ±2mm strutture)
 *           o width montante diversa
 *  - 0 → numero layer diverso o almeno una categoria diversa in posizione
 *
 * NON gestisce inversione (a→b vs b→a): per pareti simmetriche due
 * inserimenti specchiati non matchano. È intenzionale per ora — pattern
 * di simmetria sarà aggiunto se servono falsi negativi reali.
 */
export function compareCompositions(
  a: LayerFingerprint[],
  b: LayerFingerprint[],
): CompositionMatch {
  if (a.length !== b.length || a.length === 0) {
    return { score: 0, reason: 'length_mismatch' };
  }
  let totalDelta = 0;
  let exactCount = 0;
  for (let i = 0; i < a.length; i++) {
    const fa = a[i];
    const fb = b[i];
    if (fa.category !== fb.category) {
      return { score: 0, reason: 'category_mismatch' };
    }
    const tolerance = fa.category.startsWith('structure_')
      ? STRUCTURE_THICKNESS_TOLERANCE_MM
      : NON_STRUCTURE_THICKNESS_TOLERANCE_MM;
    const delta = Math.abs(fa.thicknessMm - fb.thicknessMm);
    if (delta > tolerance) {
      return { score: 0, reason: 'thickness_mismatch' };
    }
    if (fa.category === 'structure_frame' && fa.studWidthMm && fb.studWidthMm) {
      if (fa.studWidthMm !== fb.studWidthMm) {
        // Width diversa: non è un match exact ma può essere loose
        totalDelta += 0.15;
      }
    }
    if (delta === 0) exactCount++;
    totalDelta += delta * 0.05; // ogni mm di delta toglie 0.05 dallo score
  }
  const baseScore = 1 - totalDelta / a.length;
  // Boost per match esatti su tutti i layer
  const exactRatio = exactCount / a.length;
  const score = Math.min(1, Math.max(0, baseScore * 0.85 + exactRatio * 0.15));
  return { score };
}
