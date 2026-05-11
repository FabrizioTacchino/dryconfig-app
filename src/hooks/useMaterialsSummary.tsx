import { useMemo } from 'react';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { useWasteFactors } from './useWasteFactors';

export interface MaterialSummaryItem {
  materialId: string;
  materialName: string;
  materialCode: string;
  supplier: string;
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
  supplier: string;
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
          const a = ensureAcc(matKey, () => ({
            materialId: material.id,
            materialName: material.name,
            materialCode: material.code || '',
            supplier: material.supplier || '',
            category: CATEGORY_LABELS[material.category] || material.category,
            unit: (matUnit === 'scatola' && matBox > 0) ? 'scatola' : matUnit,
            unitPrice: Number(material.unit_price ?? 0),
            isPackaged: matUnit === 'scatola' && matBox > 0,
            boxPieces: matBox > 0 ? matBox : undefined,
            theoreticalQuantity: 0,
            usageUnit: matUnit,
            wastePercentage: wasteMap[material.category] ?? 0,
            stratigraphyNames: [],
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
            supplier: screw.supplier || '',
            category: 'Viti',
            unit: (screwUnit === 'scatola' && boxPieces > 0) ? 'scatola' : (screwUnit || 'pz'),
            unitPrice: Number(screw.unit_price ?? 0),
            isPackaged: screwUnit === 'scatola' && boxPieces > 0,
            boxPieces: boxPieces > 0 ? boxPieces : undefined,
            totalPieces: 0,
            theoreticalQuantity: 0,
            usageUnit: 'pz',
            wastePercentage: wasteMap['screw'] ?? 0,
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
          supplier: (comp.material_supplier as string) || '',
          category: 'Finitura',
          unit: (matUnit === 'scatola' && box > 0) ? 'scatola' : (matUnit || 'pz'),
          unitPrice: Number(comp.unit_price ?? 0),
          isPackaged: matUnit === 'scatola' && box > 0,
          boxPieces: box > 0 ? box : undefined,
          theoreticalQuantity: 0,
          usageUnit: matUnit || 'pz',
          wastePercentage: wasteMap['finish'] ?? 0,
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

      if (a.isPackaged && a.boxPieces && a.boxPieces > 0) {
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

      items.push({
        materialId: a.materialId,
        materialName: a.materialName,
        materialCode: a.materialCode,
        supplier: a.supplier,
        category: a.category,
        unit: a.unit,
        unitPrice: a.unitPrice,
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
