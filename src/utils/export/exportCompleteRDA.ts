/**
 * Export PDF del preventivo completo "RDA" (Riepilogo Distinte e Analisi).
 *
 * Layout A4 professionale, ricostruito da zero per F13:
 *  - Pagina 1: copertina con info preventivo e sommario costi finale
 *  - Pagine 2..N: una pagina per stratigrafia con composizione tabellare
 *  - Pagina finale: riepilogo materiali da acquistare con sfridi
 *
 * Usa jspdf + jspdf-autotable. Mantiene la signature pubblica
 * exportCompleteRDA(estimate, stratigraphies) per non rompere i chiamanti.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Estimate } from '@/types';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

interface StratigraphyWithLayers extends EstimateStratigraphy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stratigraphy?: any;
}

interface AggregatedMaterial {
  category: string;
  name: string;
  code: string;
  supplier: string;
  unit: string;
  theoreticalQty: number;
  wastePct: number;
  purchaseQty: number;
  unitPrice: number;
  totalCost: number;
  stratigraphies: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  board: 'Lastre',
  structure_frame: 'Montanti',
  structure_guide: 'Guide',
  insulation: 'Isolanti',
  screw: 'Viti',
  accessory: 'Accessori',
  finish: 'Finitura',
  ceiling_tile: 'Controsoffitto',
  other: 'Altri',
};

const CATEGORY_ORDER = [
  'board', 'structure_frame', 'structure_guide', 'insulation',
  'screw', 'accessory', 'finish', 'ceiling_tile', 'other',
];

// ============================================================================
// Helper di lettura layer
// ============================================================================

function getLayersOf(s: StratigraphyWithLayers): Array<Record<string, unknown>> {
  if (s.isSnapshot && Array.isArray(s.layersData)) return s.layersData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromJoin = (s as any).stratigraphy?.layers;
  if (Array.isArray(fromJoin)) return fromJoin;
  return [];
}

function getMatOf(layer: Record<string, unknown>): Record<string, unknown> | null {
  return (layer.material ?? layer.materials) as Record<string, unknown> | null;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function euro(v: number): string {
  return `€ ${v.toFixed(2)}`;
}

// ============================================================================
// Aggregazione materiali per riepilogo finale
// ============================================================================

function aggregateMaterials(stratigraphies: StratigraphyWithLayers[]): AggregatedMaterial[] {
  const map = new Map<string, AggregatedMaterial>();

  for (const strat of stratigraphies) {
    const area = num(strat.area, 0);
    if (area <= 0) continue;
    const layers = getLayersOf(strat);

    for (const layer of layers) {
      const mat = getMatOf(layer);
      if (!mat) continue;
      const category = String(mat.category ?? 'other');
      const matId = String(mat.id ?? mat.code ?? mat.name ?? '');
      if (!matId) continue;

      // Calcolo quantità incidence-based (semplificato per export PDF)
      const incidence = num(mat.incidence_per_sqm, 1);
      const theoreticalQty = area * incidence;
      const wastePct = num(mat.waste_percentage, 0);
      const purchaseQty = theoreticalQty * (1 + wastePct / 100);
      const unitPrice = num(mat.unit_price, 0);
      const totalCost = purchaseQty * unitPrice;

      const key = matId + ':' + category;
      const existing = map.get(key);
      if (existing) {
        existing.theoreticalQty += theoreticalQty;
        existing.purchaseQty += purchaseQty;
        existing.totalCost += totalCost;
        if (!existing.stratigraphies.includes(strat.name)) {
          existing.stratigraphies.push(strat.name);
        }
      } else {
        map.set(key, {
          category,
          name: String(mat.name ?? '—'),
          code: String(mat.code ?? ''),
          supplier: String(mat.supplier ?? ''),
          unit: String(mat.unit ?? 'mq'),
          theoreticalQty,
          wastePct,
          purchaseQty,
          unitPrice,
          totalCost,
          stratigraphies: [strat.name],
        });
      }

      // === Viti del layer ===
      const screw = (layer.screw_materials ?? layer.screwMaterial) as Record<string, unknown> | null;
      const screwQty = num(layer.screw_quantity ?? layer.screwQuantity, 0);
      if (screw && screwQty > 0) {
        const screwId = String(screw.id ?? screw.code ?? screw.name ?? '');
        if (!screwId) continue;
        const screwTheoQty = area * screwQty;
        const screwWastePct = num(screw.waste_percentage, 0);
        const screwUnit = String(screw.unit ?? 'pz').toLowerCase();
        const boxPieces = num(screw.box_pieces, 0);
        const screwUnitPrice = num(screw.unit_price, 0);
        const screwQtyWithWaste = screwTheoQty * (1 + screwWastePct / 100);
        let screwPurchaseQty = screwQtyWithWaste;
        let screwTotalCost = screwUnitPrice * screwQtyWithWaste;
        if (screwUnit === 'scatola' && boxPieces > 0) {
          screwPurchaseQty = Math.ceil(screwQtyWithWaste / boxPieces);
          screwTotalCost = screwPurchaseQty * screwUnitPrice;
        }
        const screwKey = screwId + ':screw';
        const existingScrew = map.get(screwKey);
        if (existingScrew) {
          existingScrew.theoreticalQty += screwTheoQty;
          existingScrew.purchaseQty += screwPurchaseQty;
          existingScrew.totalCost += screwTotalCost;
          if (!existingScrew.stratigraphies.includes(strat.name)) {
            existingScrew.stratigraphies.push(strat.name);
          }
        } else {
          map.set(screwKey, {
            category: 'screw',
            name: String(screw.name ?? 'Vite'),
            code: String(screw.code ?? ''),
            supplier: String(screw.supplier ?? ''),
            unit: screwUnit === 'scatola' && boxPieces > 0 ? 'scatola' : 'pz',
            theoreticalQty: screwTheoQty,
            wastePct: screwWastePct,
            purchaseQty: screwPurchaseQty,
            unitPrice: screwUnitPrice,
            totalCost: screwTotalCost,
            stratigraphies: [strat.name],
          });
        }
      }
    }
  }

  // Ordina: prima per categoria (ordine definito), poi alfabetico
  return Array.from(map.values()).sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
  });
}

// ============================================================================
// Export principale
// ============================================================================

export const exportCompleteRDA = async (
  estimate: Estimate,
  stratigraphies: StratigraphyWithLayers[],
): Promise<void> => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // ========== PAGINA 1: COPERTINA ==========
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('PREVENTIVO', margin, 30);

  pdf.setFontSize(14);
  pdf.setTextColor(100);
  pdf.text(estimate.name, margin, 40);
  pdf.setTextColor(0);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Data: ${new Date(estimate.createdAt).toLocaleDateString('it-IT')}`, margin, 50);
  if (estimate.description) {
    const wrappedDesc = pdf.splitTextToSize(`Descrizione: ${estimate.description}`, pageWidth - 2 * margin);
    pdf.text(wrappedDesc, margin, 57);
  }
  if (estimate.notes) {
    pdf.text('Note:', margin, 75);
    const wrappedNotes = pdf.splitTextToSize(estimate.notes, pageWidth - 2 * margin);
    pdf.text(wrappedNotes, margin, 82);
  }

  // Tabella riepilogo stratigrafie
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Stratigrafie del preventivo', margin, 105);

  const totMaterials = stratigraphies.reduce((s, st) => s + num(st.unitCost) * num(st.area), 0);

  autoTable(pdf, {
    startY: 110,
    head: [['#', 'Nome', 'Area (m²)', '€/m²', 'Totale']],
    body: stratigraphies.map((s, i) => [
      String(i + 1),
      s.name,
      num(s.area).toFixed(2),
      euro(num(s.unitCost)),
      euro(num(s.unitCost) * num(s.area)),
    ]),
    foot: [['', 'TOTALE', stratigraphies.reduce((sum, s) => sum + num(s.area), 0).toFixed(2), '', euro(totMaterials)]],
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [40, 80, 130] },
    footStyles: { fillColor: [220, 230, 240], textColor: 0, fontStyle: 'bold' },
  });

  // ========== PAGINE 2..N: DETTAGLIO STRATIGRAFIE ==========
  for (const strat of stratigraphies) {
    pdf.addPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(strat.name, margin, 25);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    pdf.text(`Area: ${num(strat.area).toFixed(2)} m² · Costo unitario: ${euro(num(strat.unitCost))}/m² · Totale: ${euro(num(strat.unitCost) * num(strat.area))}`, margin, 32);
    pdf.setTextColor(0);

    const layers = getLayersOf(strat);
    const body = layers.map((layer, idx) => {
      const mat = getMatOf(layer);
      if (!mat) return [String(idx + 1), '— (vuoto)', '—', '—', '—'];
      const category = CATEGORY_LABEL[String(mat.category ?? '')] ?? String(mat.category ?? '');
      const thickness = num(layer.thickness ?? mat.thickness);
      const name = String(mat.name ?? '—');
      const supplier = String(mat.supplier ?? '');
      const unitPrice = num(mat.unit_price);
      return [
        String(idx + 1),
        category,
        name + (supplier ? ` (${supplier})` : ''),
        thickness > 0 ? `${thickness} mm` : '—',
        unitPrice > 0 ? `${euro(unitPrice)} /${String(mat.unit ?? 'mq')}` : '—',
      ];
    });

    autoTable(pdf, {
      startY: 40,
      head: [['#', 'Categoria', 'Materiale', 'Spessore', 'Prezzo unitario']],
      body,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 80, 130] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 32 },
      },
    });

    // Costo breakdown (se disponibile)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (pdf as any).lastAutoTable?.finalY ?? 100;
    if (finalY < pageHeight - 50) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Costo per m²', margin, finalY + 12);
      pdf.setFont('helvetica', 'normal');
      const totThick = layers.reduce((sum, l) => {
        const mat = getMatOf(l);
        if (!mat) return sum;
        if (String(mat.category ?? '').startsWith('structure')) return sum;
        return sum + num(l.thickness ?? mat.thickness);
      }, 0);
      pdf.setFontSize(9);
      pdf.text(`Spessore totale: ${totThick.toFixed(1)} mm`, margin, finalY + 18);
      pdf.text(`Costo unitario: ${euro(num(strat.unitCost))}/m²`, margin, finalY + 24);
      pdf.text(`Costo totale (${num(strat.area).toFixed(2)} m²): ${euro(num(strat.unitCost) * num(strat.area))}`, margin, finalY + 30);
    }
  }

  // ========== PAGINA FINALE: RIEPILOGO MATERIALI DA ACQUISTARE ==========
  pdf.addPage();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Riepilogo materiali da acquistare', margin, 25);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text('Quantità aggregate da tutte le stratigrafie del preventivo, con sfridi applicati.', margin, 32);
  pdf.setTextColor(0);

  const aggregated = aggregateMaterials(stratigraphies);
  const grouped = new Map<string, AggregatedMaterial[]>();
  for (const m of aggregated) {
    const arr = grouped.get(m.category) ?? [];
    arr.push(m);
    grouped.set(m.category, arr);
  }

  let lastY = 38;
  let totalMaterialsCost = 0;
  for (const category of CATEGORY_ORDER) {
    const items = grouped.get(category);
    if (!items || items.length === 0) continue;
    const categoryTotal = items.reduce((s, i) => s + i.totalCost, 0);
    totalMaterialsCost += categoryTotal;

    autoTable(pdf, {
      startY: lastY + 4,
      head: [[
        { content: `${CATEGORY_LABEL[category]} — ${euro(categoryTotal)}`, colSpan: 6, styles: { fillColor: [40, 80, 130], textColor: 255 } },
      ], ['Materiale', 'Codice', 'Fornitore', 'Sfrido', 'Qtà acquisto', 'Costo']],
      body: items.map(i => [
        i.name,
        i.code,
        i.supplier,
        i.wastePct > 0 ? `+${i.wastePct}%` : '—',
        `${i.purchaseQty < 10 ? i.purchaseQty.toFixed(2) : Math.round(i.purchaseQty)} ${i.unit}`,
        euro(i.totalCost),
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [80, 120, 170], textColor: 255 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (pdf as any).lastAutoTable?.finalY ?? lastY;

    if (lastY > pageHeight - 40) {
      pdf.addPage();
      lastY = 20;
    }
  }

  // ========== SOMMARIO FINALE ==========
  if (lastY > pageHeight - 60) {
    pdf.addPage();
    lastY = 20;
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Sommario costi', margin, lastY + 15);

  const totLabor = stratigraphies.reduce((sum, s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stratigraphy = (s as any).stratigraphy ?? {};
    const laborPerSqm = num(stratigraphy.labor_cost_per_sqm);
    return sum + laborPerSqm * num(s.area);
  }, 0);
  const totFinish = stratigraphies.reduce((sum, s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = (s as any).finishCostPerSqm;
    if (f == null) return sum;
    return sum + num(f) * num(s.area);
  }, 0);
  const totGen = totMaterialsCost + totLabor + totFinish;

  autoTable(pdf, {
    startY: lastY + 20,
    head: [['Voce', 'Importo']],
    body: [
      ['Materiali (da acquistare con sfridi)', euro(totMaterialsCost)],
      ['Manodopera', euro(totLabor)],
      ...(totFinish > 0 ? [['Finitura', euro(totFinish)] as [string, string]] : []),
    ],
    foot: [['TOTALE GENERALE', euro(totGen)]],
    theme: 'plain',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    footStyles: { fillColor: [40, 80, 130], textColor: 255, fontStyle: 'bold', fontSize: 13 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right' },
    },
  });

  // Footer su tutte le pagine
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Pagina ${i} di ${pageCount} · Generato da DryConfig · ${new Date().toLocaleDateString('it-IT')}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    );
    pdf.setTextColor(0);
  }

  // Salva
  const safeName = estimate.name.replace(/[^a-z0-9_-]/gi, '_');
  pdf.save(`preventivo_${safeName}.pdf`);
};
