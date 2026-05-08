import type { DatabaseMaterial } from '@/hooks/useMaterials';

/**
 * Tipo Layer V2 — più semplice e disaccoppiato dal vecchio configuratore.
 *
 * Ogni layer rappresenta uno strato della stratigrafia (lastra, montante, guida,
 * isolante, accessorio). L'ordine è quello con cui viene mostrato/montato.
 */
export interface LayerV2 {
  /** ID locale (UUID v4 generato lato client). Sostituito da uuid DB al save. */
  id: string;
  /** Posizione 1-based nella stratigrafia, riassegnata al riordino. */
  position: number;
  /** ID del materiale nel catalogo. */
  materialId: string | null;
  /** Snapshot del materiale (per evitare round-trip al DB). */
  material: DatabaseMaterial | null;
  /** Spessore in mm — può differire da material.thickness se è "variabile" (es. isolante). */
  thickness: number;
  /** Interasse profili in mm (solo per structure_frame, default 600). */
  interAxis?: number;
  /** Vite associata (solo per layer board). */
  screwMaterialId?: string | null;
  screwMaterial?: DatabaseMaterial | null;
  screwQuantity?: number;
  screwCostPerSqm?: number;
}

/**
 * Tipologia stratigrafia auto-rilevata.
 * - `partition`: parete divisoria (lastre da entrambi i lati di una struttura)
 * - `lining`: controparete (lastre solo da un lato)
 * - `ceiling`: controsoffitto
 * - `unknown`: ancora indeterminata
 */
export type StratigraphyTypology = 'partition' | 'lining' | 'ceiling' | 'unknown';

/**
 * Stato globale del configuratore V2.
 */
export interface ConfiguratorV2State {
  id: string | null;          // null se nuova
  name: string;
  description: string;
  layers: LayerV2[];
  isDirty: boolean;
  isSaving: boolean;
  loadError: string | null;
}
