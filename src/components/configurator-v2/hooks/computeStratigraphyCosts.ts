import type { LayerV2 } from '../types';

/**
 * Calcola il breakdown costi al m² di una stratigrafia.
 *
 * Formule per categoria:
 *  - board / ceiling_tile / finish: costo già €/m² (unit=mq) → 1 m²/m²
 *  - structure_frame (montante): ml/m² = 1000 / studSpacingMm
 *      es. passo 600mm → 1.667 ml/m² × €/ml
 *  - structure_guide (guida): ml/m² = 2 / wallHeightM ≈ 0.74 a H=2.7m
 *      (1 guida superiore + 1 inferiore per metro lineare di parete)
 *  - insulation: copre il vano fra montanti, cover factor = (passo - widthMontante) / passo
 *      es. passo 600, mont 75 → 0.875 m² isolante per m² parete
 *  - screw: già in layer.screwCostPerSqm (calcolato altrove)
 *
 * Manodopera: somma `installation_time_per_sqm × cost_per_hour` per ogni layer.
 *
 * Risparmio: (list_price - net_price) × quantity, sommato per layer con sconto attivo.
 */

export interface CostRowMaterial {
  layerIdx: number;
  layerNum: number; // 1-indexed
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPriceNet: number;
  unitPriceList: number;
  rowCost: number;
  rowSavings: number;
  /** Minuti di posa per la quantità di questa riga (m² di parete). */
  rowMinutes: number;
  notes?: string;
}

export interface CostRowScrews {
  layerIdx: number;
  layerNum: number;
  screwName: string;
  screwQuantityPerSqm: number;
  pricePerPiece: number;
  rowCost: number;
  rowMinutes: number;
}

export interface CostBreakdown {
  rows: CostRowMaterial[];
  /** Righe viti — una per ogni layer che ha screwMaterial assegnato. */
  screwRows: CostRowScrews[];
  subtotalMaterials: number;
  /** Totale viti (somma layer.screwCostPerSqm). */
  subtotalScrews: number;
  /** Tempo manodopera totale in MINUTI per m² (somma minuti righe). */
  laborMinutes: number;
  /** Tempo manodopera in h/m² (laborMinutes / 60). */
  laborTime: number;
  /** Costo manodopera = laborTime × costPerHour. */
  laborCost: number;
  /** Totale generale €/m² (materiali + viti + manodopera). */
  totalCost: number;
  /** Risparmio totale applicato (delta listino - netto). */
  totalSavings: number;
}

const WALL_HEIGHT_M = 2.7; // altezza convenzionale per calcolo guide (m)

export function computeStratigraphyCosts(
  layers: LayerV2[],
  studSpacingMm: number,
  costPerHour: number,
): CostBreakdown {
  const rows: CostRowMaterial[] = [];
  const screwRows: CostRowScrews[] = [];
  let subtotalMaterials = 0;
  let subtotalScrews = 0;
  let laborMinutes = 0;
  let totalSavings = 0;

  // Trova la width del montante principale (per calcolo cover isolante)
  const studWidthMm = (() => {
    const studLayer = layers.find(l => l.material?.category === 'structure_frame');
    return Number(studLayer?.material?.width ?? 75);
  })();

  layers.forEach((l, idx) => {
    const m = l.material;
    if (!m || !l.materialId) return;

    const cat = m.category;
    const netPrice = Number(m.net_price ?? m.unit_price ?? 0);
    const listPrice = Number(m.list_price ?? netPrice);
    const unit = m.unit ?? '—';

    let quantity = 0;
    let notes: string | undefined;

    if (cat === 'board' || cat === 'ceiling_tile' || cat === 'finish') {
      // €/m² → quantità 1 m²/m²
      quantity = 1;
    } else if (cat === 'structure_frame') {
      // €/ml → ml/m² = 1000/passo
      quantity = 1000 / studSpacingMm;
      notes = `${quantity.toFixed(2)} ml/m² (passo ${studSpacingMm}mm)`;
    } else if (cat === 'structure_guide') {
      // €/ml → 2 guide per ml di parete, divise per altezza
      quantity = 2 / WALL_HEIGHT_M;
      notes = `${quantity.toFixed(2)} ml/m² (H=${WALL_HEIGHT_M}m)`;
    } else if (cat === 'insulation') {
      // m² isolante per m² parete = (passo - widthMont) / passo
      const cover = Math.max(0, (studSpacingMm - studWidthMm) / studSpacingMm);
      quantity = cover > 0 ? cover : 1; // fallback 100% se isolante orfano
      notes = `${(quantity * 100).toFixed(0)}% (vano fra montanti ${studSpacingMm}/${studWidthMm}mm)`;
    } else if (cat === 'screw') {
      // Le viti come materiale-layer sono ignorate qui (gestite via layer.screwMaterial)
      return;
    } else {
      // accessory, other → costo diretto
      quantity = 1;
    }

    const rowCost = netPrice * quantity;
    const rowSavings = (listPrice - netPrice) * quantity;
    // Tempo manodopera: installation_time_per_sqm è in ORE per unit del materiale.
    // Convertiamo in minuti totali per la quantità di m² di parete.
    const timePerUnitH = Number(m.installation_time_per_sqm ?? 0);
    const rowMinutes = timePerUnitH * quantity * 60;

    rows.push({
      layerIdx: idx,
      layerNum: idx + 1,
      name: m.name ?? '—',
      category: cat,
      quantity,
      unit,
      unitPriceNet: netPrice,
      unitPriceList: listPrice,
      rowCost,
      rowSavings,
      rowMinutes,
      notes,
    });
    subtotalMaterials += rowCost;
    if (rowSavings > 0.001) totalSavings += rowSavings;
    if (rowMinutes > 0) laborMinutes += rowMinutes;

    // === VITI del layer (se presenti) ===
    // screwQuantity è il numero di viti per m² di parete.
    // installation_time_per_sqm sulla vite è ORE per singola vite (es. 5s = 5/3600 h/pz).
    const screwCostPerSqm = Number(l.screwCostPerSqm ?? 0);
    const screwQty = Number(l.screwQuantity ?? 0);
    const screw = l.screwMaterial;
    if (screwCostPerSqm > 0 && screw && screwQty > 0) {
      const screwTimePerPieceH = Number(screw.installation_time_per_sqm ?? 0);
      const screwMinutes = screwTimePerPieceH * screwQty * 60;
      const pricePerPiece = screwQty > 0 ? screwCostPerSqm / screwQty : 0;
      screwRows.push({
        layerIdx: idx,
        layerNum: idx + 1,
        screwName: screw.name ?? 'Vite',
        screwQuantityPerSqm: screwQty,
        pricePerPiece,
        rowCost: screwCostPerSqm,
        rowMinutes: screwMinutes,
      });
      subtotalScrews += screwCostPerSqm;
      laborMinutes += screwMinutes;
    } else if (screwCostPerSqm > 0) {
      // Fallback: cost senza materiale vite associato
      subtotalScrews += screwCostPerSqm;
    }
  });

  const laborTime = laborMinutes / 60;
  const laborCost = laborTime * (costPerHour > 0 ? costPerHour : 30);
  const totalCost = subtotalMaterials + subtotalScrews + laborCost;

  return {
    rows,
    screwRows,
    subtotalMaterials,
    subtotalScrews,
    laborMinutes,
    laborTime,
    laborCost,
    totalCost,
    totalSavings,
  };
}
