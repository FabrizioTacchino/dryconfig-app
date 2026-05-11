import type { LayerV2, StratigraphyTypology } from '../types';
import type { DatabaseMaterial } from '@/hooks/useMaterials';

/**
 * Sistema di raccomandazione viti V2 — funzione pura.
 *
 * Riusa concetti del modulo V1 (mapping board → categoria, regole DB) ma con
 * 2 differenze chiave:
 *
 *   1. **deriveSideRole semantico**: la posizione del layer (single/first_prov/
 *      final_visible/intermediate) è calcolata RISPETTO AL LATO della parete
 *      (lato A o B di una partition / lato unico di una lining), non rispetto
 *      all'indice array. Convenzione V2: layer[0] = lato A esterno (visibile).
 *   2. **Spessore pacchetto = somma spessori del SOTTO-PACCHETTO** che la vite
 *      deve attraversare (dalla lastra corrente fino al montante). Per la
 *      lastra esterna = tutte le lastre del lato; per la interna = solo lei.
 *
 * Il modulo è una funzione pura: niente useState/useEffect/useQuery.
 * Le regole DB e il catalogo viti vanno passati dall'esterno.
 */

// ============================================================================
// Tipi
// ============================================================================

export type BoardCategory =
  | 'gesso_rivestito'
  | 'gessofibra'
  | 'cemento_fibroarmato'
  | 'silicato';

export type SupportType = 'metal_thin' | 'metal_thick' | 'wood';

export type LayerSideRole =
  | 'single'             // unica lastra del lato → fissaggio definitivo (17/m²)
  | 'first_provisional'  // lastra interna (vicina al montante) → provvisorio (6/m²)
  | 'intermediate'       // lastra in mezzo → intermedio (10/m²)
  | 'final_visible';     // lastra esterna (più lontana dal montante) → definitivo (17/m²)

export type WallTypeForRules = 'partition' | 'lining' | 'ceiling';

export interface ScrewLengthRule {
  id: string;
  board_type: string;
  support_type: SupportType;
  min_total_thickness_mm: number;
  max_total_thickness_mm: number;
  min_penetration_mm: number;
  recommended_length_mm: number;
  preferred_codes: string[];
  notes: string | null;
}

export interface ScrewSpacingRule {
  id: string;
  wall_type: WallTypeForRules;
  layer_position: LayerSideRole;
  board_type: string;
  spacing_field_mm: number;
  spacing_edge_mm: number;
  screws_per_sqm: number;
  staggered: boolean;
  notes: string | null;
}

export interface ScrewPreference {
  id: string;
  organization_id: string;
  length_rule_id: string;
  /** UUID materiale preferito. NULL = preferenza presente ma materiale eliminato dal catalogo. */
  preferred_material_id: string | null;
  priority: number;
}

export type ScrewPickSource =
  | 'org_preference'    // primario dalla preferenza dell'organization
  | 'system_preferred'  // primario dai preferred_codes della regola di sistema
  | 'shortest'          // fallback al candidato più corto compatibile
  | 'none';             // nessun candidato

export interface ScrewSuggestion {
  /** Vite consigliata (può essere null se nulla matcha). */
  recommended: DatabaseMaterial | null;
  /** Tutte le viti compatibili (matching board_type AND length sufficiente), ordinate per length crescente. */
  candidates: DatabaseMaterial[];
  /** Viti compatibili per board_type, di qualsiasi lunghezza (per UI fallback). */
  byBoardType: DatabaseMaterial[];
  /** Quantità viti/m² consigliata da regola spacing. */
  screwsPerSqm: number;
  /** Lunghezza minima (mm) per attraversare il sotto-pacchetto + 10mm penetrazione. */
  requiredLengthMm: number;
  /** Lunghezza raccomandata dalla regola DB (può essere > requiredLength per safety). */
  recommendedLengthMm: number;
  /** Spessore sotto-pacchetto considerato (mm) — somma lastre del lato fino al montante dal layer corrente. */
  subPackThicknessMm: number;
  /** Categoria board mappata. */
  boardCategory: BoardCategory;
  /** Ruolo del layer nel lato (single/first_provisional/intermediate/final_visible). */
  sideRole: LayerSideRole;
  /** Lato di appartenenza ('A', 'B' per partition; 'A' per lining/ceiling). */
  side: 'A' | 'B';
  /** Tipo supporto rilevato. */
  supportType: SupportType;
  /** Frase pronta per UI. */
  reason: string;
  /** Warnings: ['no-rule', 'no-compat-screw', 'no-stud', ...] */
  warnings: string[];
  /** Da dove arriva la `recommended` (org pref / sistema / fallback). */
  pickSource: ScrewPickSource;
  /** True se l'org aveva una preferenza ma non era utilizzabile (materiale eliminato o non più compatibile). */
  orgPreferenceFallback: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const norm = (s: string | null | undefined) =>
  String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const hasAny = (haystack: string, needles: string[]) =>
  needles.some(n => haystack.includes(n));

const PENETRATION_MM = 10;

/**
 * Mappa board → categoria standard usata dalle regole DB.
 *
 * Riconosce: cementizia (Aquaroc, Aquapanel), silicato (Promat, Aestuver),
 * gessofibra (Fermacell, Rigidur), default = gesso_rivestito.
 */
export function mapBoardToCategory(
  board?: Pick<DatabaseMaterial, 'board_type' | 'material_type' | 'name' | 'category'> | null,
): BoardCategory {
  if (!board) return 'gesso_rivestito';
  const bt = norm(board.board_type);
  const mt = norm(board.material_type);
  const nm = norm(board.name);

  if (
    hasAny(bt, ['cement', 'fibrocemento', 'cementiz']) ||
    hasAny(mt, ['cement', 'fibrocemento']) ||
    hasAny(nm, ['aquaroc', 'aquapanel', 'cementizia', 'fibrocemento', 'cementiz'])
  ) return 'cemento_fibroarmato';

  if (
    hasAny(bt, ['silicat']) ||
    hasAny(mt, ['silicat']) ||
    hasAny(nm, ['silicato', 'silicate', 'promat', 'aestuver'])
  ) return 'silicato';

  if (
    hasAny(bt, ['gessofibra', 'fibre', 'gypsum fibre']) ||
    hasAny(mt, ['gessofibra']) ||
    hasAny(nm, ['fermacell', 'rigidur'])
  ) return 'gessofibra';

  return 'gesso_rivestito';
}

/**
 * Mappa typology stratigrafia → wallType usato dalle regole DB.
 * partition/lining/ceiling mapping diretto; unknown → partition come default safe.
 */
export function typologyToWallType(t: StratigraphyTypology): WallTypeForRules {
  if (t === 'partition' || t === 'lining' || t === 'ceiling') return t;
  return 'partition';
}

/**
 * Rileva il tipo supporto in base allo spessore lamiera del montante più vicino.
 * `metal_thin` se < 0.7 mm, `metal_thick` se >= 0.7 mm. Fallback metal_thin.
 *
 * Per supporto `wood` non c'è auto-detect: serve segnalazione manuale (uso futuro).
 */
export function detectSupportType(layers: LayerV2[]): SupportType {
  const stud = layers.find(l => l.material?.category === 'structure_frame');
  const sheetMm = Number(stud?.material?.sheet_thickness ?? 0);
  if (sheetMm >= 0.7) return 'metal_thick';
  return 'metal_thin';
}

// ============================================================================
// Side role: il cuore della logica posizionale
// ============================================================================

/**
 * Per un layer board, calcola lato (A/B) e ruolo (single/final/first_prov/intermediate)
 * RISPETTO AL LATO della parete, NON in base all'indice array assoluto.
 *
 * Convenzione V2:
 *  - layer[0..firstStructIdx-1]   = Lato A   (esterno → interno verso montante)
 *  - layer[lastStructIdx+1..end]  = Lato B   (interno verso montante → esterno)
 *
 * Lastra "final_visible" (definitiva) = la più ESTERNA del lato.
 * Lastra "first_provisional" (provvisoria) = la più VICINA al montante.
 *
 * Esempio partition 2+2 lastre 12.5mm:
 *   idx 0 (Lato A esterno)   → final_visible      vite lunga (35mm)
 *   idx 1 (Lato A interno)   → first_provisional  vite corta (25mm)
 *   idx 2 (structure_frame)
 *   idx 3 (Lato B interno)   → first_provisional  vite corta (25mm)
 *   idx 4 (Lato B esterno)   → final_visible      vite lunga (35mm)
 */
export interface SideRoleInfo {
  side: 'A' | 'B';
  role: LayerSideRole;
  /** Lastre del lato in ordine ESTERNO → INTERNO (cioè verso il montante). */
  sideLayers: LayerV2[];
  /** Indice 0-based della lastra corrente nelle sideLayers. 0 = più esterna. */
  positionInSide: number;
}

export function deriveSideRole(layers: LayerV2[], layerIdx: number): SideRoleInfo | null {
  const target = layers[layerIdx];
  if (!target || target.material?.category !== 'board') return null;

  const structIndices = layers
    .map((l, i) => (l.material?.category === 'structure_frame' ? i : -1))
    .filter(i => i >= 0);
  const firstStructIdx = structIndices.length > 0 ? structIndices[0] : -1;
  const lastStructIdx = structIndices.length > 0 ? structIndices[structIndices.length - 1] : -1;

  // Identifica lato di appartenenza
  let side: 'A' | 'B';
  let sideLayers: LayerV2[];
  let positionInSide: number;

  if (firstStructIdx === -1) {
    // Niente struttura (es. lining su muro) → tutto è lato A
    side = 'A';
    const boardLayers = layers.filter(l => l.material?.category === 'board');
    sideLayers = boardLayers; // ordine: idx0 esterno → idxN interno
    positionInSide = boardLayers.findIndex(l => l.id === target.id);
  } else if (layerIdx < firstStructIdx) {
    side = 'A';
    // Lato A: indices [0..firstStructIdx-1], ordine array = esterno → interno
    const boardLayersA = layers
      .slice(0, firstStructIdx)
      .filter(l => l.material?.category === 'board');
    sideLayers = boardLayersA;
    positionInSide = boardLayersA.findIndex(l => l.id === target.id);
  } else if (layerIdx > lastStructIdx) {
    side = 'B';
    // Lato B: indices [lastStructIdx+1..end], ordine array = interno → esterno
    // Per uniformità (positionInSide=0 = esterno) inverto.
    const boardLayersB = layers
      .slice(lastStructIdx + 1)
      .filter(l => l.material?.category === 'board')
      .reverse();
    sideLayers = boardLayersB;
    positionInSide = boardLayersB.findIndex(l => l.id === target.id);
  } else {
    // Lastra in mezzo a doppia struttura — caso raro, lo trattiamo come lato A
    side = 'A';
    sideLayers = [target];
    positionInSide = 0;
  }

  // Calcola ruolo
  const total = sideLayers.length;
  let role: LayerSideRole;
  if (total <= 1) role = 'single';
  else if (positionInSide === 0) role = 'final_visible';        // più esterna
  else if (positionInSide === total - 1) role = 'first_provisional'; // più vicina al montante
  else role = 'intermediate';

  return { side, role, sideLayers, positionInSide };
}

/**
 * Spessore sotto-pacchetto che la vite deve attraversare per fissare la lastra
 * corrente al montante.
 *
 * Per la lastra esterna (final_visible) → somma spessori di TUTTE le lastre del lato.
 * Per la lastra interna (first_provisional) → solo lo spessore della lastra corrente.
 * Per intermediate → spessore corrente + spessori di tutte le lastre più ESTERNE
 * (… in realtà no: la vite intermedia fissa solo le lastre tra essa e il montante,
 * cioè spessore dalla lastra corrente fino al montante = lastre dalla position
 * `positionInSide` fino a `total-1`).
 */
export function computeSubPackThickness(info: SideRoleInfo): number {
  const { sideLayers, positionInSide } = info;
  // Vite passa attraverso le lastre da `positionInSide` (inclusa) fino all'ultima
  // della sideLayers (la più vicina al montante).
  let sum = 0;
  for (let i = positionInSide; i < sideLayers.length; i++) {
    const l = sideLayers[i];
    sum += Number(l.thickness ?? l.material?.thickness ?? 0);
  }
  return sum;
}

// ============================================================================
// Funzione principale
// ============================================================================

interface ComputeSuggestionInput {
  layers: LayerV2[];
  layerIdx: number;
  allScrews: DatabaseMaterial[];
  wallType: WallTypeForRules;
  supportType: SupportType;
  lengthRules: ScrewLengthRule[];
  spacingRules: ScrewSpacingRule[];
  /** Preferenze viti dell'organization corrente. Vince sui preferred_codes di sistema. */
  orgPreferences?: ScrewPreference[];
}

/**
 * Calcola la raccomandazione vite per il layer board all'indice `layerIdx`.
 * Restituisce `null` se il layer non è una board.
 */
export function computeScrewSuggestion(input: ComputeSuggestionInput): ScrewSuggestion | null {
  const { layers, layerIdx, allScrews, wallType, supportType, lengthRules, spacingRules, orgPreferences = [] } = input;
  const target = layers[layerIdx];
  if (!target || target.material?.category !== 'board') return null;

  const sideInfo = deriveSideRole(layers, layerIdx);
  if (!sideInfo) return null;

  const boardCategory = mapBoardToCategory(target.material);
  const subPackMm = computeSubPackThickness(sideInfo);
  const requiredLength = subPackMm + PENETRATION_MM;

  // Match length rule
  const lengthRule = lengthRules.find(
    r =>
      r.board_type === boardCategory &&
      r.support_type === supportType &&
      Number(subPackMm) >= Number(r.min_total_thickness_mm) &&
      Number(subPackMm) <= Number(r.max_total_thickness_mm),
  );
  const recommendedLength = lengthRule?.recommended_length_mm ?? Math.ceil(requiredLength / 5) * 5;

  // Filtro viti per categoria board (case-insensitive trim)
  const byBoardType = allScrews.filter(s => {
    const types = Array.isArray(s.compatible_board_types)
      ? s.compatible_board_types.map(t => norm(t))
      : [];
    return types.includes(boardCategory);
  });

  // Candidate = compatibili per categoria AND length sufficiente
  const candidates = byBoardType
    .filter(s => Number(s.length ?? s.thickness ?? 0) >= requiredLength - 0.001)
    .sort((a, b) => Number(a.length ?? 0) - Number(b.length ?? 0));

  // === Pick recommended in 3 step: org preference → preferred_codes sistema → shortest candidate ===
  let recommended: DatabaseMaterial | null = null;
  let pickSource: ScrewPickSource = 'none';
  let orgPreferenceFallback = false;

  // 1. Preferenze organization (per length_rule_id, ordinate per priority asc)
  if (lengthRule && orgPreferences.length > 0) {
    const prefs = orgPreferences
      .filter(p => p.length_rule_id === lengthRule.id)
      .sort((a, b) => a.priority - b.priority);
    for (const pref of prefs) {
      if (!pref.preferred_material_id) {
        // Preferenza orfana (materiale eliminato dal catalogo) → segnala fallback
        orgPreferenceFallback = true;
        continue;
      }
      const m = candidates.find(s => s.id === pref.preferred_material_id);
      if (m) {
        recommended = m;
        pickSource = 'org_preference';
        break;
      }
      // Materiale esiste ma non è candidato (length insufficiente?) → segnala fallback
      orgPreferenceFallback = true;
    }
  }

  // 2. preferred_codes della regola di sistema (case-insensitive)
  if (!recommended && lengthRule?.preferred_codes?.length) {
    for (const code of lengthRule.preferred_codes) {
      const m = candidates.find(s => norm(s.code) === norm(code));
      if (m) { recommended = m; pickSource = 'system_preferred'; break; }
    }
  }

  // 3. Candidato più corto compatibile
  if (!recommended) {
    recommended = candidates[0] ?? null;
    pickSource = recommended ? 'shortest' : 'none';
  }

  // Spacing rule → screws_per_sqm
  const spacingRule =
    spacingRules.find(
      r =>
        r.wall_type === wallType &&
        r.layer_position === sideInfo.role &&
        r.board_type === boardCategory,
    ) ??
    spacingRules.find(
      r =>
        r.wall_type === wallType &&
        r.layer_position === sideInfo.role &&
        r.board_type === 'gesso_rivestito',
    ) ??
    null;
  const screwsPerSqm = Number(spacingRule?.screws_per_sqm ?? defaultSpacingFor(sideInfo.role));

  // Reason testuale
  const sideLabel = sideInfo.side === 'A' ? 'lato A' : 'lato B';
  const roleLabel: Record<LayerSideRole, string> = {
    single: 'unica lastra',
    first_provisional: 'lastra interna (provvisoria)',
    intermediate: 'lastra intermedia',
    final_visible: 'lastra esterna (a vista)',
  };
  const parts = [
    `Pacchetto ${subPackMm.toFixed(0)}mm · ${sideLabel} · ${roleLabel[sideInfo.role]}`,
    `vite ≥ ${recommendedLength}mm`,
  ];
  if (lengthRule?.notes) parts.push(lengthRule.notes);
  const reason = parts.join(' · ');

  // Warnings
  const warnings: string[] = [];
  if (!lengthRule) warnings.push('no-length-rule');
  if (byBoardType.length === 0) warnings.push('no-compat-screw-type');
  if (candidates.length === 0) warnings.push('no-candidate-with-length');
  if (!recommended) warnings.push('no-recommended');
  if (!spacingRule) warnings.push('no-spacing-rule');
  if (orgPreferenceFallback) warnings.push('org-preference-fallback');

  return {
    recommended,
    candidates,
    byBoardType,
    screwsPerSqm,
    requiredLengthMm: requiredLength,
    recommendedLengthMm: recommendedLength,
    subPackThicknessMm: subPackMm,
    boardCategory,
    sideRole: sideInfo.role,
    side: sideInfo.side,
    supportType,
    reason,
    warnings,
    pickSource,
    orgPreferenceFallback,
  };
}

/** Default screws/m² se nessuna regola spacing matcha (fallback safe). */
function defaultSpacingFor(role: LayerSideRole): number {
  switch (role) {
    case 'first_provisional': return 6;
    case 'intermediate': return 10;
    case 'final_visible':
    case 'single':
    default:
      return 17;
  }
}
