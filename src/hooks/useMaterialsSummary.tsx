import { useMemo } from 'react';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { useWasteFactors } from './useWasteFactors';

/**
 * Risolve lo sfrido per un materiale seguendo la priorità:
 *   1. material.waste_percentage (se NOT NULL) — override esplicito sul singolo materiale
 *   2. wasteMap[category]                       — Settings → Sfridi per organization
 *   3. 0                                        — fallback safe
 */
function resolveWaste(
  material: { waste_percentage?: number | null; category?: string },
  wasteMap: Record<string, number>,
  fallbackCategory?: string,
): number {
  const override = material.waste_percentage;
  if (override !== null && override !== undefined && Number.isFinite(Number(override))) {
    return Number(override);
  }
  const cat = (fallbackCategory ?? material.category) ?? '';
  return Number(wasteMap[cat] ?? 0);
}

export interface MaterialSummaryItem {
  materialId: string;
  materialName: string;
  materialCode: string;
  /** EAN/GTIN per scansione barcode dal magazziniere fornitore (F31). */
  ean?: string | null;
  /** Nome supplier (legacy testo). Tenuto per backwards-compat. */
  supplier: string;
  /** FK suppliers.id (F31): serve per raggruppare l'ordine fornitore. */
  supplierId?: string | null;
  category: string;
  /** Unità d'acquisto (es. 'scatola', 'mq', 'ml', 'pz'). */
  unit: string;
  /** Prezzo nella unità d'acquisto (es. €/scatola per le viti). Netto/scontato. */
  unitPrice: number;
  /**
   * Quantità d'acquisto: scatole intere per viti, m²/ml/pz arrotondati per gli altri.
   * Calcolato in fase 2 dopo aver aggregato tutte le stratigrafie.
   */
  totalQuantity: number;
  /** Costo totale d'acquisto = totalQuantity × unitPrice. */
  totalCost: number;
  /** Per le viti: pezzi effettivamente utilizzati (teorico, prima dello sfrido). */
  piecesUsed?: number;
  /** Per le viti: pezzi per scatola (dal catalogo). */
  boxPieces?: number;
  /** Quantità teorica di consumo (somma su tutte le stratigrafie, no sfrido). */
  theoreticalQuantity?: number;
  /** Sfrido % applicato (0-100). */
  wastePercentage?: number;
  stratigraphyNames: string[];
}

/**
 * Stato interno accumulato in fase 1. Manca `totalQuantity`/`totalCost`
 * perché vanno calcolati in fase 2 dopo aver visto tutte le stratigrafie
 * (per le viti: somma pezzi → ceil su scatole, altrimenti errore di
 * doppio-arrotondamento layer-per-layer).
 */
interface MaterialAccumulator {
  materialId: string;
  materialName: string;
  materialCode: string;
  ean?: string | null;
  supplier: string;
  supplierId?: string | null;
  category: string;
  /** Unità d'acquisto. */
  unit: string;
  /** Prezzo per unità d'acquisto (es. €/scatola). */
  unitPrice: number;
  /** True se vendita a scatola: applicare ceil per scatole intere. */
  isPackaged: boolean;
  /** Pezzi per scatola (se isPackaged). */
  boxPieces?: number;
  /** Per le viti: pezzi totali. Per altri: come `theoreticalQuantity`. */
  totalPieces?: number;
  /** Quantità teorica accumulata (pre-sfrido). Unità coerente con `usageUnit`. */
  theoreticalQuantity: number;
  /** Unità di misura del consumo teorico (es. 'pz' per viti, 'mq' per lastre). */
  usageUnit: string;
  wastePercentage: number;
  stratigraphyNames: string[];
  /**
   * F32: true per le lastre con width+length valorizzati e unit='mq'. In
   * fase 2 il consumo (in m²) viene convertito in pezzi interi con
   * ceil(m² / area_foglio). Se false → formula attuale invariata.
   */
  isSheetBased?: boolean;
  /** F32: area del singolo foglio in m² (es. lastra 1200×3000 → 3.6). */
  sheetAreaMq?: number;
  /** F32: prezzo €/foglio = unit_price (€/m²) × sheetAreaMq. */
  pricePerSheet?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  board: 'Lastre',
  structure_frame: 'Montanti',
  structure_guide: 'Guide',
  insulation: 'Isolamento',
  accessory: 'Accessori',
  screw: 'Viti',
  finish: 'Finitura',
  ceiling_tile: 'Controsoffitto',
  other: 'Altri',
};

export const useMaterialsSummary = (estimateStratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[] = []) => {
  const { wasteMap } = useWasteFactors();

  const materialsSummary = useMemo(() => {
    // ============== FASE 1: ACCUMULO QUANTITÀ TEORICHE ==============
    const acc = new Map<string, MaterialAccumulator>();

    const ensureAcc = (key: string, init: () => MaterialAccumulator): MaterialAccumulator => {
      let a = acc.get(key);
      if (!a) { a = init(); acc.set(key, a); }
      return a;
    };

    estimateStratigraphies.forEach((estStrat) => {
      if (!estStrat.stratigraphy?.layers || !estStrat.area) return;
      const wallHeight = estStrat.wallHeight || 2.7;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      estStrat.stratigraphy.layers.forEach((layer: any) => {
        const material = layer.materials ?? layer.material;
        if (!material) return;

        // === MATERIALE PRINCIPALE (lastre, struttura, isolanti, accessori) ===
        const incidence = Number(material.incidence_per_sqm ?? 1);
        let theoreticalQty = 0;
        if (material.category === 'board' || material.category === 'insulation' || material.category === 'accessory') {
          theoreticalQty = estStrat.area * incidence;
        } else if (material.category === 'structure_frame') {
          const interAxis = layer.inter_axis || 600;
          theoreticalQty = estStrat.area * (1000 / interAxis);
        } else if (material.category === 'structure_guide') {
          theoreticalQty = (estStrat.area / wallHeight) * 2;
        } else if (material.category !== 'screw') {
          theoreticalQty = estStrat.area * incidence;
        }

        if (theoreticalQty > 0) {
          const matKey = `${material.id}_${material.category}`;
          const matUnit = String(material.unit ?? 'mq').toLowerCase().trim();
          const matBox = Number(material.box_pieces ?? 0);
          // F32: rilevamento "vendita a foglio" per le lastre (e ceiling_tile).
          // Si attiva solo se ho dimensioni reali del foglio E unit='mq'. Senza
          // dimensioni il fallback è la formula classica (theoreticalQty in m²,
          // sfrido %, € = m² × prezzo), garantendo zero regressioni sui 43 mat
          // del catalogo senza width/length e su tutti gli snapshot pre-F32.
          const widthMm = Number(material.width ?? 0);
          const lengthMm = Number(material.length ?? 0);
          const isSheetBasedCandidate =
            (material.category === 'board' || material.category === 'ceiling_tile') &&
            matUnit === 'mq' &&
            widthMm > 0 && lengthMm > 0;
          const sheetAreaMq = isSheetBasedCandidate
            ? (widthMm * lengthMm) / 1_000_000
            : undefined;
          const matUnitPrice = Number(material.unit_price ?? 0);
          const pricePerSheet = (isSheetBasedCandidate && sheetAreaMq)
            ? matUnitPrice * sheetAreaMq
            : undefined;

          const a = ensureAcc(matKey, () => ({
            materialId: material.id,
            materialName: material.name,
            materialCode: material.code || '',
            ean: material.ean_code ?? null,
            supplier: material.supplier || '',
            supplierId: material.supplier_id ?? null,
            category: CATEGORY_LABELS[material.category] || material.category,
            // Se sheet-based: unit d'acquisto = 'pz'. Altrimenti come prima.
            unit: isSheetBasedCandidate
              ? 'pz'
              : ((matUnit === 'scatola' && matBox > 0) ? 'scatola' : matUnit),
            unitPrice: matUnitPrice,
            isPackaged: matUnit === 'scatola' && matBox > 0,
            boxPieces: matBox > 0 ? matBox : undefined,
            theoreticalQuantity: 0,
            usageUnit: matUnit, // m² consumati teorici (resta in m²)
            wastePercentage: resolveWaste(material, wasteMap),
            stratigraphyNames: [],
            isSheetBased: isSheetBasedCandidate,
            sheetAreaMq,
            pricePerSheet,
          }));
          a.theoreticalQuantity += theoreticalQty;
          if (!a.stratigraphyNames.includes(estStrat.name)) a.stratigraphyNames.push(estStrat.name);
        }

        // === VITI del layer ===
        const screw = layer.screw_materials ?? layer.screwMaterial;
        const screwQtyPerSqm = Number(layer.screw_quantity ?? layer.screwQuantity ?? 0);
        if (screw && screwQtyPerSqm > 0) {
          const screwKey = `${screw.id}_screw_purchase`;
          const piecesTheo = estStrat.area * screwQtyPerSqm;
          const boxPieces = Number(screw.box_pieces ?? 0);
          const screwUnit = String(screw.unit ?? 'pz').toLowerCase().trim();
          const a = ensureAcc(screwKey, () => ({
            materialId: screw.id,
            materialName: screw.name,
            materialCode: screw.code || '',
            ean: screw.ean_code ?? null,
            supplier: screw.supplier || '',
            supplierId: screw.supplier_id ?? null,
            category: 'Viti',
            unit: (screwUnit === 'scatola' && boxPieces > 0) ? 'scatola' : (screwUnit || 'pz'),
            unitPrice: Number(screw.unit_price ?? 0),
            isPackaged: screwUnit === 'scatola' && boxPieces > 0,
            boxPieces: boxPieces > 0 ? boxPieces : undefined,
            totalPieces: 0,
            theoreticalQuantity: 0,
            usageUnit: 'pz',
            wastePercentage: resolveWaste(screw, wasteMap, 'screw'),
            stratigraphyNames: [],
          }));
          a.totalPieces = (a.totalPieces ?? 0) + piecesTheo;
          a.theoreticalQuantity += piecesTheo;
          if (!a.stratigraphyNames.includes(estStrat.name)) a.stratigraphyNames.push(estStrat.name);
        }
      });

      // === FINITURA (a livello parete, non layer) ===
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finishComps = Array.isArray((estStrat as any).finishComponentsData)
        ? (estStrat as any).finishComponentsData as Array<Record<string, unknown>>
        : [];
      for (const comp of finishComps) {
        const matId = comp.material_id as string | undefined;
        if (!matId) continue;
        const qtyPerSqm = Number(comp.quantity_per_sqm ?? 0);
        if (qtyPerSqm <= 0) continue;

        const finishKey = `${matId}_finish`;
        const matUnit = String(comp.material_unit ?? 'pz').toLowerCase().trim();
        const box = Number(comp.box_pieces ?? 0);
        const theoTotalQty = estStrat.area * qtyPerSqm;
        const a = ensureAcc(finishKey, () => ({
          materialId: matId,
          materialName: (comp.material_name as string) || 'Componente finitura',
          materialCode: (comp.material_code as string) || '',
          ean: (comp.material_ean as string | null) ?? null,
          supplier: (comp.material_supplier as string) || '',
          supplierId: (comp.material_supplier_id as string | null) ?? null,
          category: 'Finitura',
          unit: (matUnit === 'scatola' && box > 0) ? 'scatola' : (matUnit || 'pz'),
          unitPrice: Number(comp.unit_price ?? 0),
          isPackaged: matUnit === 'scatola' && box > 0,
          boxPieces: box > 0 ? box : undefined,
          theoreticalQuantity: 0,
          usageUnit: matUnit || 'pz',
          wastePercentage: resolveWaste(
            { waste_percentage: comp.waste_percentage as number | null | undefined, category: 'finish' },
            wasteMap,
            'finish',
          ),
          stratigraphyNames: [],
        }));
        a.theoreticalQuantity += theoTotalQty;
        if (!a.stratigraphyNames.includes(estStrat.name)) a.stratigraphyNames.push(estStrat.name);
      }
    });

    // ============== FASE 2: APPLICA SFRIDO + SCATOLE INTERE ==============
    const items: MaterialSummaryItem[] = [];
    for (const a of acc.values()) {
      const wasteMultiplier = 1 + (a.wastePercentage || 0) / 100;
      let totalQuantity: number;
      let totalCost: number;
      let pieces: number | undefined;

      if (a.isSheetBased && a.sheetAreaMq && a.sheetAreaMq > 0 && a.pricePerSheet) {
        // F32: vendita a foglio (lastra / ceiling_tile con dimensioni note).
        // Converte m² teorici → pezzi interi via ceil, applicando lo sfrido %
        // PRIMA del ceil così il posatore conservatore ottiene 1-2 lastre di
        // scorta quando lo sfrido categoria è > 0. Costo finale = pezzi ×
        // (unit_price €/m² × area_foglio m²).
        const mqWithWaste = a.theoreticalQuantity * wasteMultiplier;
        totalQuantity = Math.ceil(mqWithWaste / a.sheetAreaMq);
        totalCost = Math.round(totalQuantity * a.pricePerSheet * 100) / 100;
        // Pezzi teorici (pre-sfrido) — info utile a video / PDF.
        pieces = Math.ceil(a.theoreticalQuantity / a.sheetAreaMq);
      } else if (a.isPackaged && a.boxPieces && a.boxPieces > 0) {
        // Vendita a scatola: somma pezzi → ceil su scatole intere UNA SOLA volta.
        const totalPiecesTheo = a.totalPieces ?? a.theoreticalQuantity;
        const piecesWithWaste = totalPiecesTheo * wasteMultiplier;
        totalQuantity = Math.ceil(piecesWithWaste / a.boxPieces);
        totalCost = Math.round(totalQuantity * a.unitPrice * 100) / 100;
        pieces = totalPiecesTheo;
      } else {
        // Vendita decimale (kg, m², ml, pz singolo): applica sfrido + arrotonda 2 dec.
        const qtyWithWaste = a.theoreticalQuantity * wasteMultiplier;
        totalQuantity = Math.round(qtyWithWaste * 100) / 100;
        totalCost = Math.round(totalQuantity * a.unitPrice * 100) / 100;
        if (a.totalPieces !== undefined) pieces = a.totalPieces;
      }

      // F32: per le lastre sheet-based esponiamo il prezzo €/foglio (utile a
      // video/PDF: "8 pz × 59,84 €/pz"). Per gli altri materiali resta il
      // prezzo nell'unità d'acquisto storica (es. €/scatola, €/m²).
      const displayUnitPrice = (a.isSheetBased && a.pricePerSheet)
        ? Math.round(a.pricePerSheet * 100) / 100
        : a.unitPrice;

      items.push({
        materialId: a.materialId,
        materialName: a.materialName,
        materialCode: a.materialCode,
        ean: a.ean,
        supplier: a.supplier,
        supplierId: a.supplierId,
        category: a.category,
        unit: a.unit,
        unitPrice: displayUnitPrice,
        totalQuantity,
        totalCost,
        piecesUsed: pieces,
        boxPieces: a.boxPieces,
        theoreticalQuantity: a.theoreticalQuantity,
        wastePercentage: a.wastePercentage,
        stratigraphyNames: a.stratigraphyNames,
      });
    }

    return items.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.materialName.localeCompare(b.materialName);
    });
  }, [estimateStratigraphies, wasteMap]);

  const totalCost = useMemo(() => {
    return materialsSummary.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [materialsSummary]);

  const totalLaborCost = useMemo(() => {
    return estimateStratigraphies.reduce((sum, estStrat) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const laborCostPerSqm = Number((estStrat.stratigraphy as any)?.labor_cost_per_sqm ?? 0);
      return sum + laborCostPerSqm * Number(estStrat.area ?? 0);
    }, 0);
  }, [estimateStratigraphies]);

  const totalByCategory = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    materialsSummary.forEach(item => {
      const current = categoryTotals.get(item.category) || 0;
      categoryTotals.set(item.category, current + item.totalCost);
    });
    return Object.fromEntries(categoryTotals);
  }, [materialsSummary]);

  return {
    materialsSummary,
    totalCost,
    totalLaborCost,
    totalByCategory,
    isEmpty: materialsSummary.length === 0,
  };
};
