import type { LayerV2 } from '../../types';

/**
 * Modello "wall section" semantico, derivato dai layer raw.
 *
 * Differenza chiave: nei layer raw l'isolante e i montanti sono in posizioni
 * separate, ma in una parete REALE l'isolante riempie il VANO TRA i montanti
 * (stessa profondità del montante, NON si somma).
 *
 * Questo modulo aggrega i layer in "blocchi visuali":
 *  - boardBlocks (lastre) — sommano spessore in profondità
 *  - structureBlock (montanti+guide+isolante) — UNICO blocco con larghezza =
 *    width del montante; l'isolante è dentro, non somma profondità.
 */

export type DrawingMaterialKind =
  | 'board_standard'
  | 'board_fire'
  | 'board_hydro'
  | 'board_high_density'
  | 'board_cement'
  | 'board_glasroc'
  | 'board_perforated'
  | 'rockwool'
  | 'glasswool'
  | 'eps'
  | 'pir'
  | 'osb'
  | 'membrane'
  | 'vapor_barrier'
  | 'metal'
  | 'screw'
  | 'unknown';

export interface BoardBlock {
  kind: 'board';
  layer: LayerV2;
  thicknessMm: number;
  materialKind: DrawingMaterialKind;
  fillId: string;            // id del pattern/gradient SVG
  label: string;             // nome breve per callout
}

export interface StructureBlock {
  kind: 'structure';
  /** Profondità del vano (= width del montante in mm). */
  depthMm: number;
  /** Layer del montante principale. */
  studLayer: LayerV2 | null;
  /** Layer eventuale di guida (se ne hai messa una nei layer V2). */
  guideLayer: LayerV2 | null;
  /** Layer dell'isolante interno (se presente). Lo spessore può essere ≤ depth. */
  insulationLayer: LayerV2 | null;
  /** Pattern fill dell'isolante. */
  insulationFillId: string | null;
  /** Etichette di supporto per la legenda. */
  studLabel: string | null;
  guideLabel: string | null;
  insulationLabel: string | null;
}

export type WallBlock = BoardBlock | StructureBlock;

export interface WallSectionModel {
  blocks: WallBlock[];
  /** Spessore totale parete in mm (somma profondità dei blocchi). */
  totalThicknessMm: number;
  /** Numero di lastre lato A (prima della prima struttura). */
  boardsSideA: number;
  /** Numero di lastre lato B. */
  boardsSideB: number;
  /** True se ha doppia struttura. */
  hasDoubleStructure: boolean;
}

/**
 * Riconosce il tipo di materiale per scegliere il pattern SVG corretto.
 */
export function classifyMaterial(layer: LayerV2): { kind: DrawingMaterialKind; fillId: string; label: string } {
  const m = layer.material;
  if (!m) return { kind: 'unknown', fillId: 'grad-board-std', label: 'Layer vuoto' };

  const cat = m.category;
  const mt = (m.material_type ?? '').toLowerCase();
  const en520 = (m.en_520_type ?? '').toLowerCase();
  const board_typology = (m.board_typology ?? '').toLowerCase();
  const name = (m.name ?? '').toLowerCase();

  // Lastre forate (Gyptone/Rigitone)
  if (cat === 'board' && /forat|rigitone|gyptone|acoust/.test(`${board_typology} ${mt} ${name}`)) {
    return { kind: 'board_perforated', fillId: 'pat-board-perforated', label: m.name };
  }
  // Lastre cementizie
  if (cat === 'board' && /cement|aquaroc/.test(mt)) {
    return { kind: 'board_cement', fillId: 'grad-board-cement', label: m.name };
  }
  // Glasroc velo vetro
  if (cat === 'board' && /glasroc/.test(mt)) {
    return { kind: 'board_glasroc', fillId: 'grad-board-glasroc', label: m.name };
  }
  // Gesso ignifugo (DF)
  if (cat === 'board' && /ignifug|fire|dfir|^df/.test(`${board_typology} ${mt} ${en520}`)) {
    return { kind: 'board_fire', fillId: 'grad-board-fire', label: m.name };
  }
  // Gesso idrofugo (H1)
  if (cat === 'board' && /idro|hydro|h1/.test(`${board_typology} ${mt} ${en520}`)) {
    return { kind: 'board_hydro', fillId: 'grad-board-hydro', label: m.name };
  }
  // Alta densità (Habito ecc.)
  if (cat === 'board' && /alta_dens|habito|d, i/.test(`${board_typology} ${mt} ${en520}`)) {
    return { kind: 'board_high_density', fillId: 'grad-board-hd', label: m.name };
  }
  // Cartongesso standard
  if (cat === 'board') {
    return { kind: 'board_standard', fillId: 'grad-board-std', label: m.name };
  }

  // Isolanti
  if (cat === 'insulation') {
    if (/lana_roccia|rock|airrock/.test(`${mt} ${name}`)) {
      return { kind: 'rockwool', fillId: 'pat-rockwool', label: m.name };
    }
    if (/lana_vetro|isover|topsil|arena|uni/.test(`${mt} ${name}`)) {
      return { kind: 'glasswool', fillId: 'pat-glasswool', label: m.name };
    }
    if (/eps|xps/.test(mt)) return { kind: 'eps', fillId: 'pat-eps', label: m.name };
    if (/pir|pur/.test(mt)) return { kind: 'pir', fillId: 'pat-pir', label: m.name };
    if (/osb/.test(`${mt} ${name}`)) return { kind: 'osb', fillId: 'pat-osb', label: m.name };
    return { kind: 'rockwool', fillId: 'pat-rockwool', label: m.name }; // default
  }

  if (cat === 'structure_frame' || cat === 'structure_guide') {
    return { kind: 'metal', fillId: 'grad-metal', label: m.name };
  }
  if (cat === 'screw') return { kind: 'screw', fillId: '', label: m.name };

  return { kind: 'unknown', fillId: 'grad-board-std', label: m.name };
}

/**
 * Costruisce il modello wall section dai layer raw.
 *
 * Logica:
 *  - Iteriamo i layer in ordine.
 *  - I layer board diventano BoardBlock individuali (sommano profondità).
 *  - Quando incontriamo un structure_frame, raggruppiamo:
 *    studLayer = il primo structure_frame
 *    guideLayer = primo structure_guide consecutivo (opzionale)
 *    insulationLayer = primo insulation consecutivo (opzionale)
 *    Tutti dentro lo stesso StructureBlock con depth = studLayer.material.width
 *      (o studLayer.thickness se width manca).
 *  - Layer accessory/finish/screw/ceiling_tile ignorati nel disegno (tracciati altrove).
 */
export function buildWallSectionModel(layers: LayerV2[]): WallSectionModel {
  const blocks: WallBlock[] = [];
  let i = 0;
  let boardsSideA = 0;
  let boardsSideB = 0;
  let structureCount = 0;

  while (i < layers.length) {
    const l = layers[i];
    const cat = l.material?.category;

    if (cat === 'board') {
      const cls = classifyMaterial(l);
      blocks.push({
        kind: 'board',
        layer: l,
        thicknessMm: Number(l.thickness) || 0,
        materialKind: cls.kind,
        fillId: cls.fillId,
        label: cls.label,
      });
      if (structureCount === 0) boardsSideA++;
      else boardsSideB++;
      i++;
      continue;
    }

    if (cat === 'structure_frame') {
      const stud = l;
      let guide: LayerV2 | null = null;
      let insul: LayerV2 | null = null;

      // Cerca guide e isolante adiacenti (in qualsiasi ordine, fino al prossimo board o end)
      let j = i + 1;
      while (j < layers.length) {
        const cj = layers[j].material?.category;
        if (cj === 'structure_guide' && !guide) { guide = layers[j]; j++; continue; }
        if (cj === 'insulation' && !insul) { insul = layers[j]; j++; continue; }
        if (cj === 'structure_frame') break; // doppia struttura, gestita al giro dopo
        if (cj === 'board') break;
        // Altre categorie (accessory/screw/finish): skip silente
        j++;
      }

      const depthMm = Number(stud.material?.width) || Number(stud.thickness) || 75;
      const insulCls = insul ? classifyMaterial(insul) : null;

      blocks.push({
        kind: 'structure',
        depthMm,
        studLayer: stud,
        guideLayer: guide,
        insulationLayer: insul,
        insulationFillId: insulCls?.fillId ?? null,
        studLabel: stud.material?.name ?? null,
        guideLabel: guide?.material?.name ?? null,
        insulationLabel: insul?.material?.name ?? null,
      });
      structureCount++;
      i = j;
      continue;
    }

    // Layer non disegnato (structure_guide solo, insulation senza struttura, screw, accessory, finish)
    // → lo skippiamo nel modello visuale, ma è comunque presente nei calcoli costi/legenda.
    i++;
  }

  const totalThicknessMm = blocks.reduce((sum, b) => {
    return sum + (b.kind === 'board' ? b.thicknessMm : b.depthMm);
  }, 0);

  return {
    blocks,
    totalThicknessMm,
    boardsSideA,
    boardsSideB,
    hasDoubleStructure: structureCount > 1,
  };
}

/**
 * Genera un titolo dinamico stile catalogo Knauf.
 * Esempi:
 *  - "Parete cartongesso singola orditura"
 *  - "Parete acustica ad alte prestazioni"
 *  - "Parete REI 60 — doppia lastra"
 *  - "Controparete isolata"
 */
export function generateWallTitle(model: WallSectionModel, typology: 'partition' | 'lining' | 'ceiling' | 'unknown'): string {
  if (model.blocks.length === 0) return 'Configurazione vuota';

  const isPartition = typology === 'partition';
  const isLining = typology === 'lining';
  const isCeiling = typology === 'ceiling';

  // Detect proprietà speciali
  const hasFireBoard = model.blocks.some(b =>
    b.kind === 'board' && (b.materialKind === 'board_fire' || b.materialKind === 'board_high_density')
  );
  const hasHydroBoard = model.blocks.some(b =>
    b.kind === 'board' && b.materialKind === 'board_hydro'
  );
  const hasInsulation = model.blocks.some(b =>
    b.kind === 'structure' && b.insulationLayer != null
  );
  const totalBoards = model.boardsSideA + model.boardsSideB;
  const isDouble = model.hasDoubleStructure;

  if (isCeiling) return 'Controsoffitto a secco';
  if (isLining) return hasInsulation ? 'Controparete isolata' : 'Controparete';

  if (isPartition) {
    if (isDouble) return 'Parete a doppia orditura';
    if (hasFireBoard && hasInsulation) return 'Parete REI ad alte prestazioni';
    if (hasFireBoard) return 'Parete REI con lastra ignifuga';
    if (hasHydroBoard) return 'Parete idrofuga per ambienti umidi';
    if (totalBoards >= 4 && hasInsulation) return 'Parete acustica ad alte prestazioni';
    if (totalBoards >= 4) return 'Parete a doppia lastra';
    if (hasInsulation) return 'Parete cartongesso isolata';
    return 'Parete cartongesso singola orditura';
  }

  return 'Stratigrafia personalizzata';
}
