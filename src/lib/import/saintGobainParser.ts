import * as XLSX from 'xlsx';
import type { Database } from '@/integrations/supabase/types';

export type MaterialCategory = Database['public']['Enums']['material_category'];

export interface ParsedMaterial {
  // identifiers
  family_code: string;
  code: string;
  name: string;
  category: MaterialCategory;
  // pricing
  list_price: number;
  unit: 'mq' | 'm' | 'ml' | 'pz' | 'kg' | 'scatola';
  // tech
  weight_per_sqm: number | null;
  weight_per_ml: number | null;
  thickness: number | null;
  length: number | null;
  width: number | null;
  ean_code: string | null;
  delivery_indicator: 'verde' | 'giallo' | 'bianco' | null;
  description: string | null;
  source_sheet: string;
  // ---- Classification (popolata dal classifier per family+nome) ----
  /** Tipologia tecnica semantica (es. 'gesso_idrofugo', 'pannello_lana_minerale', 'profilo_guida_zincato') */
  material_type: string | null;
  /** Descrizione tecnica leggibile della lastra/pannello */
  board_type: string | null;
  /** EN 520 / EN 15283-1: tipo lastra (A, H1, DF, DFIR, GM-FH1IR, ecc.) */
  en_520_type: string | null;
  /** Classe umidità (H1/H2/H3) se applicabile */
  humidity_resistance_class: string | null;
  /** Reazione al fuoco (A1, A2-s1,d0, B-s1,d0, ...) */
  fire_class: string | null;
  /** Tipologia (standard / hydro_H1 / fireline_DF / habito / eurocoustic / ...) */
  board_typology: string | null;
  /** Sotto-tipo profilo (guida / montante / cornice / T15 / ...) */
  profile_type: string | null;
  /** Spessore lamiera profilo (mm) — usato come materials.sheet_thickness */
  sheet_thickness: number | null;
}

export interface ParseError {
  sheet: string;
  row_index: number;
  reason: string;
  raw_data?: unknown;
}

export interface ParseResult {
  rows: ParsedMaterial[];
  errors: ParseError[];
  warnings: string[];
  sheets: { name: string; total_rows: number; valid_rows: number; skipped_rows: number }[];
}

// ---- Helpers ------------------------------------------------------------

const norm = (v: unknown): string =>
  String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const findCol = (headers: string[], patterns: string[]): number => {
  for (const p of patterns) {
    const idx = headers.findIndex(h => norm(h).includes(norm(p)));
    if (idx >= 0) return idx;
  }
  return -1;
};

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const toStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
};

const parseDeliveryIndicator = (v: unknown): ParsedMaterial['delivery_indicator'] => {
  const s = norm(v);
  if (s.includes('verde')) return 'verde';
  if (s.includes('giallo')) return 'giallo';
  if (s.includes('bianco')) return 'bianco';
  return null;
};

const parseUnitFromPriceUM = (v: unknown): ParsedMaterial['unit'] => {
  const s = norm(v);
  if (s.includes('m²') || s.includes('m2') || s.includes('mq'))   return 'mq';
  if (s.includes('ml'))                                            return 'ml';
  if (s.includes('scatola'))                                       return 'scatola';
  if (s.includes('sacco') || s.includes('flacone') || s.includes('cartuccia') || s.includes('secchio')) return 'pz';
  if (s.includes('kg'))                                            return 'kg';
  if (/\bm\b/.test(s) && !s.includes('m²') && !s.includes('ml'))   return 'm';
  if (s.includes('pezzo') || s.includes('pz'))                     return 'pz';
  return 'pz';
};

// ---- Sheet configuration ------------------------------------------------

interface SheetConfig {
  /** Name pattern to match the sheet (case-insensitive contains) */
  match: string[];
  /** Default category for products in this sheet */
  category: MaterialCategory;
  /** Optional override per row */
  customRowMapper?: (
    row: unknown[],
    cols: ColumnIndices,
    sheetName: string,
  ) => Partial<ParsedMaterial>;
}

interface ColumnIndices {
  family_code: number;
  code: number;
  name: number;
  delivery: number;
  length: number;
  width: number;
  thickness: number;
  weight: number;
  list_price: number;
  price_um: number;
  ean: number;
  // optional descriptive fields rolled into description
  bordo: number;
  dimensioni: number;
  modulo: number;
  sezione: number;
}

const SHEET_CONFIGS: SheetConfig[] = [
  // Le sheet "lastre" e "controsoffitti" partono da board, ma il classifier
  // per family_code può promuovere a ceiling_tile (H37/H38) o riportare a finish.
  { match: ['lastre'],          category: 'board' },
  { match: ['controsoffitti'],  category: 'board' },
  { match: ['intonaci', 'stucchi', 'rasanti'], category: 'finish' },
  { match: ['profili'],         category: 'structure_frame' },
  { match: ['accessori', 'sistemi'], category: 'accessory' },
  // Eventuale sheet isolanti (pre-existing materials) — per forniture future
  { match: ['isolanti', 'isover'], category: 'insulation' },
];

// =========================================================================
// Classifier: family_code + nome → classificazione tecnica completa.
// Allineato con la mappa applicata al DB nella migration B3.
// =========================================================================

interface Classification {
  category: MaterialCategory;
  material_type: string | null;
  board_type: string | null;
  en_520_type: string | null;
  humidity_resistance_class: string | null;
  fire_class: string | null;
  board_typology: string | null;
  profile_type: string | null;
  /** Sezione utile profilo (mm). Per montante/guida 50, valore 50. */
  profile_width_mm: number | null;
  /** Spessore lamiera profilo (mm). Es. 0.6, 0.8, 1.0 */
  profile_sheet_thickness_mm: number | null;
}

/** Estrae sezione utile (mm) dal nome del profilo:
 *   "montante 50 DIN"            → 50
 *   "Montante 100 0,8"           → 100
 *   "guida 28/16/28"             → 16 (centro)
 *   "Montante 27/48"             → 48 (altezza utile)
 *   "Profilo portante T15"       → 15
 *   "Cornice 35x40x20"           → 35
 */
function extractProfileWidth(name: string): number | null {
  const n = name.toLowerCase();
  // T15/T24/T35 controsoffitto
  const tMatch = n.match(/\bt\s?(15|24|35)\b/);
  if (tMatch) return parseInt(tMatch[1], 10);
  // Pattern A/B/C → centro
  const triMatch = n.match(/(\d{2,3})\/(\d{2,3})\/(\d{2,3})/);
  if (triMatch) return parseInt(triMatch[2], 10);
  // Pattern AxBxC → primo (cornice 35x40x20)
  const xMatch = n.match(/(\d{2,3})x(\d{2,3})x(\d{2,3})/);
  if (xMatch) return parseInt(xMatch[1], 10);
  // Pattern A/B → secondo (altezza utile)
  const duoMatch = n.match(/(\d{2,3})\/(\d{2,3})/);
  if (duoMatch) return parseInt(duoMatch[2], 10);
  // Pattern semplice "guida|montante|omega|deformabile|stil prim X"
  const simpleMatch = n.match(/(?:guida|montante|omega|stil prim|deformabile|flexo)\s+(\d{2,3})/i);
  if (simpleMatch) return parseInt(simpleMatch[1], 10);
  return null;
}

function extractSheetThickness(name: string): number | null {
  // "0,6" / "0,8" / "1,0"
  const m = name.match(/(\d),(\d)/);
  if (m) return parseFloat(`${m[1]}.${m[2]}`);
  return null;
}

const FIRE_A2 = 'A2-s1,d0';

const emptyClassification: Classification = {
  category: 'other',
  material_type: null,
  board_type: null,
  en_520_type: null,
  humidity_resistance_class: null,
  fire_class: null,
  board_typology: null,
  profile_type: null,
  profile_width_mm: null,
  profile_sheet_thickness_mm: null,
};

const containsAny = (s: string, needles: string[]) =>
  needles.some(n => s.includes(n));

/** Classifica un prodotto Gyproc dato family_code + nome. */
export function classifyGyprocProduct(family_code: string, name: string): Classification {
  const fam = family_code.toUpperCase().trim();
  const n = norm(name);

  // ===== LASTRE GESSO RIVESTITO ==========================================
  if (fam === 'H01') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_rivestito',
    board_type: 'Lastra standard EN 520 tipo A',
    en_520_type: 'A', fire_class: FIRE_A2, board_typology: 'standard',
  };
  if (fam === 'H03') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_rivestito_vapor',
    board_type: 'Lastra standard tipo A con barriera vapore (alluminio retrostante)',
    en_520_type: 'A', fire_class: FIRE_A2, board_typology: 'vapor',
  };
  if (fam === 'H06') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_flessibile',
    board_type: 'Lastra flessibile sottile per superfici curve (EN 520 tipo A)',
    en_520_type: 'A', fire_class: FIRE_A2, board_typology: 'flex',
  };
  if (fam === 'H07') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_alta_densita',
    board_type: 'Lastra alta densità EN 520 tipo D con tecnologia Activ\'Air',
    en_520_type: 'D, I', fire_class: FIRE_A2, board_typology: 'high_density_activair',
  };
  if (fam === 'H24') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_rivestito_activair',
    board_type: 'Lastra standard EN 520 tipo A con tecnologia Activ\'Air',
    en_520_type: 'A', fire_class: FIRE_A2, board_typology: 'easy_posa',
  };
  if (fam === 'H25') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_ignifugo',
    board_type: 'Lastra ignifuga EN 520 tipo DF (densità incrementata + additivi antifuoco)',
    en_520_type: 'DF', fire_class: FIRE_A2, board_typology: 'fireline_DF',
  };
  if (fam === 'H26') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_idrofugo',
    board_type: 'Lastra idrorepellente EN 520 tipo H1 per ambienti umidi',
    en_520_type: 'H1', humidity_resistance_class: 'H1', fire_class: FIRE_A2,
    board_typology: 'hydro_H1',
  };
  if (fam === 'H28') {
    if (n.includes('hydro')) return {
      ...emptyClassification, category: 'board', material_type: 'gesso_alte_prestazioni_idro',
      board_type: 'Lastra Habito Hydro alte prestazioni con resistenza umidità',
      en_520_type: 'D, I, R, H1', humidity_resistance_class: 'H1', fire_class: FIRE_A2,
      board_typology: 'habito_hydro',
    };
    if (n.includes('vapor')) return {
      ...emptyClassification, category: 'board', material_type: 'gesso_alte_prestazioni_vapor',
      board_type: 'Lastra Habito Vapor con barriera vapore retrostante',
      en_520_type: 'D, I, R + barriera vapore', fire_class: FIRE_A2, board_typology: 'habito_vapor',
    };
    return {
      ...emptyClassification, category: 'board', material_type: 'gesso_alte_prestazioni',
      board_type: 'Lastra Habito EN 520 alte prestazioni (D, I, R) con Activ\'Air',
      en_520_type: 'D, I, R', fire_class: FIRE_A2, board_typology: 'habito',
    };
  }
  if (fam === 'H29') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_A1_incombustibile',
    board_type: 'Lastra Euroclasse A1 (incombustibile, senza componenti combustibili)',
    en_520_type: 'A1', fire_class: 'A1', board_typology: 'A1_incombustibile',
  };
  if (fam === 'H42') {
    if (n.includes('hydro')) return {
      ...emptyClassification, category: 'board', material_type: 'gesso_alte_prestazioni_DFIR_idro',
      board_type: 'Lastra Habito Forte Hydro DFIR + idrofuga',
      en_520_type: 'DFIR + H1', humidity_resistance_class: 'H1', fire_class: FIRE_A2,
      board_typology: 'habito_forte_DFIR_hydro',
    };
    if (n.includes('vapor')) return {
      ...emptyClassification, category: 'board', material_type: 'gesso_alte_prestazioni_DFIR_vapor',
      board_type: 'Lastra Habito Forte Vapor DFIR + barriera vapore',
      en_520_type: 'DFIR + barriera vapore', fire_class: FIRE_A2, board_typology: 'habito_forte_DFIR_vapor',
    };
    return {
      ...emptyClassification, category: 'board', material_type: 'gesso_alte_prestazioni_DFIR',
      board_type: 'Lastra Habito Forte EN 520 tipo DFIR (top di gamma)',
      en_520_type: 'DFIR', fire_class: FIRE_A2, board_typology: 'habito_forte_DFIR',
    };
  }
  if (fam === 'H44') {
    // Distingue lastra vs joint mix
    if (containsAny(n, ['joint', 'mix', 'gypfill'])) return {
      ...emptyClassification, category: 'finish', material_type: 'stucco_radiologico',
    };
    return {
      ...emptyClassification, category: 'board', material_type: 'gesso_schermante_radiazioni',
      board_type: 'Lastra baritata schermante per radiazioni X (locali radiologici/dentali)',
      en_520_type: 'D + Ba (baritata)', fire_class: FIRE_A2, board_typology: 'x_ray_protection',
    };
  }

  // ===== LASTRE CEMENTIZIE / VELO VETRO ==================================
  if (fam === 'H30') return {
    ...emptyClassification, category: 'board', material_type: 'cemento_fibroarmato',
    board_type: 'Lastra cementizia alleggerita Aquaroc per esterni / ambienti molto umidi (EN 12467)',
    fire_class: 'A1', board_typology: 'cementizia_aquaroc',
  };
  if (fam === 'H40') {
    if (n.includes('skim')) return {
      ...emptyClassification, category: 'finish', material_type: 'rasante_glasroc',
    };
    return {
      ...emptyClassification, category: 'board', material_type: 'gesso_velo_vetro_glasroc',
      board_type: 'Lastra Glasroc X (gesso velo di vetro per esterni protetti, EN 15283-1 GM-FH1IR)',
      en_520_type: 'GM-FH1IR', humidity_resistance_class: 'H1', fire_class: FIRE_A2,
      board_typology: 'glasroc_x',
    };
  }

  // ===== LASTRE ACCOPPIATE H31 ===========================================
  if (fam === 'H31') {
    let mt = 'gesso_accoppiato_isolante';
    let typology = 'accoppiata';
    if (n.includes('xp') || n.includes('xps')) { mt = 'gesso_accoppiato_xps'; typology = 'accoppiata_XPS'; }
    else if (n.includes('eps'))                 { mt = 'gesso_accoppiato_eps'; typology = 'accoppiata_EPS'; }
    else if (n.includes('pir'))                 { mt = 'gesso_accoppiato_pir'; typology = 'accoppiata_PIR'; }
    else if (containsAny(n, ['lana', 'mineral', 'glass'])) { mt = 'gesso_accoppiato_lana'; typology = 'accoppiata_lana_minerale'; }
    return {
      ...emptyClassification, category: 'board', material_type: mt,
      board_type: 'Lastra accoppiata: gesso rivestito + isolante (XPS/EPS/lana minerale/PIR)',
      en_520_type: 'A', fire_class: FIRE_A2, board_typology: typology,
    };
  }

  // ===== H41 LASTRE FORATE ACUSTICHE (Gyptone/Rigitone) ===================
  if (fam === 'H41') return {
    ...emptyClassification, category: 'board', material_type: 'gesso_forato_acustico',
    board_type: 'Lastra in gesso forata fonoassorbente per controsoffitto (Gyptone/Rigitone, Activ\'Air)',
    en_520_type: 'A', fire_class: FIRE_A2, board_typology: 'lastra_forata_acustica',
  };

  // ===== CONTROSOFFITTI: H37 (gesso a vista) e H38 (Eurocoustic) =========
  if (fam === 'H37') {
    let mt = 'pannello_gesso_rivestito_controsoffitto';
    if (n.includes('alu'))    mt = 'pannello_gesso_alluminato';
    if (n.includes('asept'))  mt = 'pannello_gesso_asettico';
    return {
      ...emptyClassification, category: 'ceiling_tile', material_type: mt,
      board_type: 'Pannello sospeso a vista in gesso rivestito (Gyprex/GyQuadro Activ\'Air)',
      fire_class: FIRE_A2, board_typology: 'ceiling_tile_gypsum',
    };
  }
  if (fam === 'H38') {
    let mt = 'pannello_lana_minerale';
    if (n.includes('opta') || n.includes('vetro')) mt = 'pannello_lana_vetro';
    if (n.includes('minerval')) mt = 'pannello_lana_minerale';
    if (containsAny(n, ['tonga', 'acoustichoc', 'aliz'])) mt = 'pannello_lana_minerale_velo_vetro';
    return {
      ...emptyClassification, category: 'ceiling_tile', material_type: mt,
      board_type: 'Pannello sospeso fonoassorbente in lana minerale o lana di vetro (Eurocoustic)',
      fire_class: FIRE_A2, board_typology: 'eurocoustic',
    };
  }

  // ===== INTONACI / RASANTI / FINITURE ===================================
  if (fam === 'H15') {
    let mt = 'intonaco_gesso_premiscelato';
    if (n.includes('scagliola')) mt = 'intonaco_scagliola';
    else if (n.includes('alabastrino')) mt = 'intonaco_alabastrino';
    else if (containsAny(n, ['light', 'alleggerit'])) mt = 'intonaco_alleggerito';
    else if (containsAny(n, ['macchina', 'meccanizzato', 'spruzzo'])) mt = 'intonaco_macchina';
    return { ...emptyClassification, category: 'finish', material_type: mt };
  }
  if (fam === 'H17') {
    let mt = 'protezione_speciale';
    if (containsAny(n, ['igniver', 'ignifug', 'sigmatic'])) mt = 'intonaco_ignifugo';
    else if (containsAny(n, ['primer', 'vipri', 'vicontact'])) mt = 'primer_aggrappante';
    return { ...emptyClassification, category: 'finish', material_type: mt };
  }
  if (fam === 'H32') {
    let mt = 'stucco_giunti';
    if (containsAny(n, ['map', 'adesiv'])) mt = 'malta_adesiva';
    else if (n.includes('promix')) mt = 'stucco_promix';
    return { ...emptyClassification, category: 'finish', material_type: mt };
  }
  if (fam === 'H33') return { ...emptyClassification, category: 'finish', material_type: 'rasante_gesso' };
  if (fam === 'H35') return {
    ...emptyClassification, category: 'finish', material_type: 'rasante_cementizio',
    humidity_resistance_class: n.includes('idro') ? 'idrofugo' : null,
  };

  // ===== STRUTTURE: H34 / H39 / H43 / H45 / H54 ===========================
  const isGuide   = n.includes('guida');
  const isStud    = n.includes('montante');
  const isOmega   = n.includes('omega');
  const isCornice = containsAny(n, ['cornice', 'perimetrale']);
  const isProfileT = /\bt\s?(15|24|35)\b/.test(n) || containsAny(n, ['portante', 'trasversale']);

  const profileWidthFromName = extractProfileWidth(name);
  const profileSheetFromName = extractSheetThickness(name);

  const profileBase = (mt: string, surface: string | null = null): Classification => ({
    ...emptyClassification,
    category: isGuide ? 'structure_guide' : (isStud || isOmega) ? 'structure_frame' : 'structure_frame',
    material_type: mt,
    profile_type: isGuide ? 'guida' : isStud ? 'montante' : isOmega ? 'omega' : 'altro',
    fire_class: 'A1',
    profile_width_mm: profileWidthFromName,
    // Default 0.6 mm per profili DIN/Gyprofile/Metalframe se non esplicitato nel nome
    profile_sheet_thickness_mm: profileSheetFromName ?? 0.6,
  });

  if (fam === 'H34') return profileBase(isGuide ? 'profilo_guida_zincato' : 'profilo_montante_zincato');
  if (fam === 'H39') return {
    ...profileBase('profilo_acciaio_zincato_magnesio'),
    profile_type: isGuide ? 'guida_esterno' : isStud ? 'montante_esterno' : 'profilo_esterno',
    // surface_finish non è in Classification ma viene gestito a parte se serve
  };
  if (fam === 'H43') {
    if (n.includes('deformabile')) return profileBase('profilo_guida_deformabile');
    if (isOmega)                    return profileBase('profilo_omega');
    if (n.includes('stil prim'))    return profileBase('profilo_stil_prim');
    if (/\bl\b/.test(n))            return profileBase('profilo_L');
    if (isGuide)                    return profileBase('profilo_guida_speciale');
    return profileBase('profilo_speciale');
  }
  if (fam === 'H54') return profileBase('profilo_metalframe_grigio');

  // ===== H45 controsoffitti modulari (mix di structure / accessory) =======
  if (fam === 'H45') {
    if (isCornice) return {
      ...emptyClassification, category: 'structure_guide',
      material_type: 'cornice_perimetrale_controsoffitto',
      profile_type: 'cornice_perimetrale',
      profile_width_mm: profileWidthFromName,
      profile_sheet_thickness_mm: profileSheetFromName ?? 0.6,
    };
    if (isProfileT) {
      const tCode = n.includes('t24') ? 'T24' : n.includes('t15') ? 'T15' : n.includes('t35') ? 'T35' : 'T_generico';
      const tWidth = tCode === 'T24' ? 24 : tCode === 'T15' ? 15 : tCode === 'T35' ? 35 : null;
      return {
        ...emptyClassification, category: 'structure_frame',
        material_type: 'profilo_T_controsoffitto',
        profile_type: tCode,
        profile_width_mm: tWidth,
        profile_sheet_thickness_mm: profileSheetFromName ?? 0.6,
      };
    }
    let mt = 'accessorio_controsoffitto';
    if (n.includes('pendin'))      mt = 'pendino_sospensione';
    else if (n.includes('antisismic')) mt = 'kit_antisismico';
    else if (n.includes('antisollev')) mt = 'clip_antisollevamento';
    else if (n.includes('molla'))      mt = 'molla_doppia_sospensione';
    else if (n.includes('clip'))       mt = 'clip_fissaggio';
    return { ...emptyClassification, category: 'accessory', material_type: mt };
  }

  // ===== H36 misto: viti + paraspigoli + nastri + sospensioni + altro ====
  if (fam === 'H36') {
    // Viti
    if (containsAny(n, ['vite', 'viti', 'screw'])) {
      // material_type qui è board_target compatibility-friendly: 'gesso_rivestito' di default
      let mt: string = 'vite_lastra';
      if (n.includes('aquaroc'))  mt = 'vite_cementizia';
      else if (n.includes('rigidur')) mt = 'vite_gessofibra';
      else if (n.includes('glasroc')) mt = 'vite_velo_vetro';
      else if (n.includes('climafit')) mt = 'vite_lastra_accoppiata';
      else if (n.includes('rigitone')) mt = 'vite_lastra_forata';
      return { ...emptyClassification, category: 'screw', material_type: mt };
    }
    // Aquabead / paraspigoli
    if (n.includes('aquabead'))    return { ...emptyClassification, category: 'accessory', material_type: 'paraspigolo_adesivo_idro' };
    if (n.includes('paraspig'))    return { ...emptyClassification, category: 'accessory', material_type: 'paraspigolo' };
    if (n.includes('parabordo'))   return { ...emptyClassification, category: 'accessory', material_type: 'parabordo' };
    if (n.includes('angol'))       return { ...emptyClassification, category: 'accessory', material_type: 'angolare_protezione' };
    // Nastri / reti
    if (containsAny(n, ['axembla', 'axemb'])) return { ...emptyClassification, category: 'accessory', material_type: 'nastro_rete_adesiv' };
    if (n.includes('nastro'))      return { ...emptyClassification, category: 'accessory', material_type: 'nastro_giunto' };
    if (n.includes('rete'))        return { ...emptyClassification, category: 'accessory', material_type: 'rete_giunto' };
    // Sospensioni / clip
    if (containsAny(n, ['pendin', 'hanger']))  return { ...emptyClassification, category: 'accessory', material_type: 'pendino_sospensione' };
    if (n.includes('molla'))                    return { ...emptyClassification, category: 'accessory', material_type: 'molla_sospensione' };
    if (n.includes('clip'))                     return { ...emptyClassification, category: 'accessory', material_type: 'clip_fissaggio' };
    if (n.includes('sospensio'))                return { ...emptyClassification, category: 'accessory', material_type: 'sospensione_diretta' };
    // Botole / sigillanti / antincendio
    if (n.includes('botola'))      return { ...emptyClassification, category: 'accessory', material_type: 'botola_ispezione' };
    if (n.includes('sigillant'))   return { ...emptyClassification, category: 'accessory', material_type: 'sigillante' };
    if (n.includes('schiuma'))     return { ...emptyClassification, category: 'accessory', material_type: 'schiuma_antincendio' };
    if (n.includes('guarnizion'))  return { ...emptyClassification, category: 'accessory', material_type: 'guarnizione_acustica' };
    if (containsAny(n, ['antincendio', 'rei']) || / ei\b/.test(' ' + n)) {
      return { ...emptyClassification, category: 'accessory', material_type: 'sistema_antincendio' };
    }
    return { ...emptyClassification, category: 'accessory', material_type: 'accessorio_generico' };
  }

  // ===== Default fallback =================================================
  return { ...emptyClassification, category: 'other', material_type: 'altro' };
}

const findSheetConfig = (sheetName: string): SheetConfig | null => {
  const n = norm(sheetName);
  return SHEET_CONFIGS.find(c => c.match.some(p => n.includes(p))) ?? null;
};

const buildColumnIndices = (headers: string[]): ColumnIndices => ({
  family_code: findCol(headers, ['fam. sconto', 'fam.sconto', 'famiglia']),
  code:        findCol(headers, ['codice articolo', 'codice']),
  name:        findCol(headers, ['prodotto', 'nome']),
  delivery:    findCol(headers, ['tempo fornitura', 'tempo']),
  length:      findCol(headers, ['lunghezza']),
  width:       findCol(headers, ['larghezza']),
  thickness:   findCol(headers, ['spessore']),
  weight:      findCol(headers, ['peso']),
  list_price:  findCol(headers, ['prezzo listino']),
  price_um:    findCol(headers, ['prezzo u.m.', 'prezzo um']),
  ean:         findCol(headers, ['ean']),
  bordo:       findCol(headers, ['bordo']),
  dimensioni:  findCol(headers, ['dimensioni']),
  modulo:      findCol(headers, ['modulo']),
  sezione:     findCol(headers, ['sezione']),
});

// ---- Main entry point ---------------------------------------------------

export const parseSaintGobainListino = (buffer: ArrayBuffer): ParseResult => {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });

  const result: ParseResult = {
    rows: [],
    errors: [],
    warnings: [],
    sheets: [],
  };

  for (const sheetName of wb.SheetNames) {
    const sheetCfg = findSheetConfig(sheetName);
    if (!sheetCfg) {
      result.warnings.push(`Sheet "${sheetName}" ignorata (non riconosciuta).`);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    if (rows.length < 2) {
      result.sheets.push({ name: sheetName, total_rows: 0, valid_rows: 0, skipped_rows: 0 });
      continue;
    }

    const headers = (rows[0] as unknown[]).map(h => String(h ?? ''));
    const cols = buildColumnIndices(headers);

    let valid = 0;
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] as unknown[];
      if (!r || r.every(c => c === null || c === '')) {
        skipped++;
        continue;
      }

      const family_code = toStr(r[cols.family_code]);
      const code = toStr(r[cols.code]);
      const name = toStr(r[cols.name]);
      const list_price = toNum(r[cols.list_price]);

      // Required fields
      if (!family_code) {
        result.errors.push({ sheet: sheetName, row_index: i, reason: 'Famiglia sconto mancante', raw_data: r });
        continue;
      }
      if (!code) {
        result.errors.push({ sheet: sheetName, row_index: i, reason: 'Codice articolo mancante', raw_data: r });
        continue;
      }
      if (!name) {
        result.errors.push({ sheet: sheetName, row_index: i, reason: 'Nome prodotto mancante', raw_data: r });
        continue;
      }
      if (list_price === null) {
        // Some sheets (Prodotti AGGIUNTI) don't have prices — flag but skip
        result.warnings.push(`${sheetName} riga ${i + 1}: ${code} ${name} senza prezzo listino, saltata.`);
        skipped++;
        continue;
      }

      const unit = parseUnitFromPriceUM(r[cols.price_um]);

      // Description: roll up Bordo / Dimensioni / Modulo / Sezione if present
      const descParts: string[] = [];
      if (cols.bordo >= 0)      { const v = toStr(r[cols.bordo]);     if (v) descParts.push(`Bordo: ${v}`); }
      if (cols.dimensioni >= 0) { const v = toStr(r[cols.dimensioni]); if (v) descParts.push(`Dim.: ${v}`); }
      if (cols.modulo >= 0)     { const v = toStr(r[cols.modulo]);    if (v) descParts.push(`Modulo: ${v}`); }
      if (cols.sezione >= 0)    { const v = toStr(r[cols.sezione]);   if (v) descParts.push(`Sezione: ${v}`); }
      const description = descParts.length > 0 ? descParts.join(' · ') : null;

      // Classificazione tecnica per family + nome (sovrascrive category di default
      // quando il classifier trova un match preciso, es. H38 → ceiling_tile).
      const cls = classifyGyprocProduct(family_code, name);
      const finalCategory: MaterialCategory = cls.category ?? sheetCfg.category;

      const isProfile = finalCategory === 'structure_frame' || finalCategory === 'structure_guide';
      const weight = toNum(r[cols.weight]);

      // Per i profili: la colonna Excel "larghezza" non esiste; uso quella del nome.
      // Per gli altri prodotti: prendo dalla colonna Excel.
      const widthFromExcel = toNum(r[cols.width]);
      const finalWidth = isProfile && cls.profile_width_mm != null
        ? cls.profile_width_mm
        : widthFromExcel;

      result.rows.push({
        family_code,
        code,
        name,
        category: finalCategory,
        list_price,
        unit,
        weight_per_sqm: isProfile ? null : weight,
        weight_per_ml:  isProfile ? weight : null,
        thickness: toNum(r[cols.thickness]),
        length:    toNum(r[cols.length]),
        width:     finalWidth,
        ean_code:  toStr(r[cols.ean]),
        delivery_indicator: parseDeliveryIndicator(r[cols.delivery]),
        description,
        source_sheet: sheetName,
        // Classification fields (saintGobainParser → useImportMaterials → DB)
        material_type:             cls.material_type,
        board_type:                cls.board_type,
        en_520_type:               cls.en_520_type,
        humidity_resistance_class: cls.humidity_resistance_class,
        fire_class:                cls.fire_class,
        board_typology:            cls.board_typology,
        profile_type:              cls.profile_type,
        sheet_thickness:           cls.profile_sheet_thickness_mm,
      });
      valid++;
    }

    result.sheets.push({
      name: sheetName,
      total_rows: rows.length - 1,
      valid_rows: valid,
      skipped_rows: skipped,
    });
  }

  return result;
};
