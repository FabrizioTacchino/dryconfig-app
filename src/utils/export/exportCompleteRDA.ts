/**
 * Export PDF "Preventivo Completo" (ex-RDA Completa), F26 redesign.
 *
 * Target: cantiere + ufficio acquisti + cliente tecnico.
 * Contenuto:
 *  - Pagina 1: cover con logo grande + dati cliente + numero offerta + totale
 *  - Pagine 2..N: dettaglio stratigrafie con composizione layer-by-layer
 *    + box performance certificate + breakdown costi
 *  - Pagina finale-1: riepilogo materiali da acquistare con sfridi
 *  - Pagina finale: sommario costi + pie chart + scaletta pagamenti +
 *    termini & condizioni
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Estimate } from '@/types';
import type { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import type { OrgProfile } from '@/hooks/useOrgSettings';
import { PRICING_DEFAULTS } from '@/hooks/useOrgSettings';
import type { Customer } from '@/hooks/useCustomers';
import { applyPricing, type CostBase } from '@/utils/pricing/applyPricing';
import { Sentry } from '@/lib/sentry';
import {
  buildOfferFilename, loadImageDataUrl, drawHeader, drawFooterOnAllPages,
  drawPieChart, drawPieLegend, drawPerformanceGrid,
  PRIMARY_RGB, SECONDARY_RGB, ACCENT_RGB,
  type PerformanceBoxRow,
} from './pdfHelpers';

interface StratigraphyWithLayers extends EstimateStratigraphy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stratigraphy?: any;
}

interface ExtendedEstimate extends Estimate {
  projectName?: string;
  customer?: Customer | null;
  offerNumber?: string | null;
  offerIssuedAt?: Date | null;
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
// Helpers
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
  return `€ ${v.toFixed(2).replace('.', ',')}`;
}

function safeDate(v: unknown): string {
  try {
    if (!v) return new Date().toLocaleDateString('it-IT');
    const d = new Date(v as string | number | Date);
    if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('it-IT');
    return d.toLocaleDateString('it-IT');
  } catch {
    return new Date().toLocaleDateString('it-IT');
  }
}

function computeCostBase(stratigraphies: StratigraphyWithLayers[]): CostBase {
  let materials = 0;
  let labor = 0;
  let finish = 0;
  let totalArea = 0;
  for (const s of stratigraphies) {
    const area = num(s.area, 0);
    totalArea += area;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inner = (s as any).stratigraphy ?? {};
    materials += (num(inner.material_cost_per_sqm) + num(inner.screw_cost_per_sqm)) * area;
    labor += num(inner.labor_cost_per_sqm) * area;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = (s as any).finishCostPerSqm;
    if (f != null) finish += num(f) * area;
  }
  return { materials, labor, finish, totalArea };
}

function performanceRows(strat: StratigraphyWithLayers): PerformanceBoxRow[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = (strat as any).stratigraphy ?? {};
  const rows: PerformanceBoxRow[] = [];
  if (s.acoustic_performance) rows.push({ label: 'Potere fonoisolante Rw', value: String(s.acoustic_performance), unit: 'dB' });
  if (s.fire_resistance_class) rows.push({ label: 'Resistenza al fuoco', value: String(s.fire_resistance_class) });
  if (s.thermal_performance) rows.push({ label: 'Conducibilità λ', value: String(s.thermal_performance), unit: 'W/mK' });
  if (s.thermal_u_value) rows.push({ label: 'Trasmittanza U', value: String(s.thermal_u_value), unit: 'W/m²K' });
  if (s.total_thickness) rows.push({ label: 'Spessore totale', value: String(s.total_thickness), unit: 'mm' });
  if (s.weight_per_sqm) rows.push({ label: 'Massa areica', value: String(s.weight_per_sqm), unit: 'kg/m²' });
  return rows;
}

// ============================================================================
// Aggregazione materiali
// ============================================================================

function aggregateMaterials(stratigraphies: StratigraphyWithLayers[]): AggregatedMaterial[] {
  const map = new Map<string, AggregatedMaterial>();
  for (const strat of stratigraphies) {
    const area = num(strat.area, 0);
    if (area <= 0) continue;
    const layers = getLayersOf(strat);
    const stratName = strat.name || '—';
    for (const layer of layers) {
      const mat = getMatOf(layer);
      if (!mat) continue;
      const category = String(mat.category ?? 'other');
      const matId = String(mat.id ?? mat.code ?? mat.name ?? '');
      if (!matId) continue;
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
        if (!existing.stratigraphies.includes(stratName)) existing.stratigraphies.push(stratName);
      } else {
        map.set(key, {
          category,
          name: String(mat.name ?? '—'),
          code: String(mat.code ?? ''),
          supplier: String(mat.supplier ?? ''),
          unit: String(mat.unit ?? 'mq'),
          theoreticalQty, wastePct, purchaseQty, unitPrice, totalCost,
          stratigraphies: [stratName],
        });
      }
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
          if (!existingScrew.stratigraphies.includes(stratName)) existingScrew.stratigraphies.push(stratName);
        } else {
          map.set(screwKey, {
            category: 'screw',
            name: String(screw.name ?? 'Vite'),
            code: String(screw.code ?? ''),
            supplier: String(screw.supplier ?? ''),
            unit: screwUnit === 'scatola' && boxPieces > 0 ? 'scatola' : 'pz',
            theoreticalQty: screwTheoQty, wastePct: screwWastePct,
            purchaseQty: screwPurchaseQty, unitPrice: screwUnitPrice,
            totalCost: screwTotalCost, stratigraphies: [stratName],
          });
        }
      }
    }
  }
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
  estimate: ExtendedEstimate,
  stratigraphies: StratigraphyWithLayers[],
  org: OrgProfile | null = null,
): Promise<void> => {
  Sentry.addBreadcrumb({
    category: 'pdf.complete',
    message: 'export start',
    level: 'info',
    data: { estimateId: estimate?.id, stratCount: stratigraphies?.length, hasOrg: !!org },
  });

  if (!estimate?.id) throw new Error('Preventivo non valido (manca id)');
  if (!Array.isArray(stratigraphies)) throw new Error('Lista stratigrafie non valida');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  const logoDataUrl = await loadImageDataUrl(org?.logo_url);

  // Pricing
  const costBase = computeCostBase(stratigraphies);
  const breakdown = applyPricing(costBase, org);
  const validityDays = num(org?.offer_validity_days, PRICING_DEFAULTS.offer_validity_days);
  const issuedAt = estimate.offerIssuedAt ?? new Date();
  const validUntil = new Date(issuedAt);
  validUntil.setDate(validUntil.getDate() + validityDays);

  // ========== PAGINA 1: COVER ==========
  let yStart = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl, bigLogo: true });

  // Banner "PREVENTIVO COMPLETO"
  pdf.setFillColor(...PRIMARY_RGB);
  pdf.rect(margin, yStart + 5, contentWidth, 14, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255);
  pdf.text('PREVENTIVO COMPLETO', margin + 5, yStart + 15);
  if (estimate.offerNumber) {
    pdf.setFontSize(12);
    pdf.text(estimate.offerNumber, pageWidth - margin - 5, yStart + 15, { align: 'right' });
  }
  pdf.setTextColor(0);

  // Dati offerta + cliente in due colonne
  const colWidth = (contentWidth - 8) / 2;
  const dataY = yStart + 25;

  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, dataY, colWidth, 38, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text('DATI OFFERTA', margin + 3, dataY + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(0);
  pdf.text(`Data emissione: ${safeDate(issuedAt)}`, margin + 3, dataY + 12);
  pdf.text(`Validità: ${validityDays} giorni`, margin + 3, dataY + 18);
  if (estimate.projectName) {
    const lbl = `Commessa: ${estimate.projectName}`;
    pdf.text(pdf.splitTextToSize(lbl, colWidth - 6), margin + 3, dataY + 24);
  }
  pdf.setFont('helvetica', 'bold');
  pdf.text(pdf.splitTextToSize(`Riferimento: ${estimate.name || 'Senza nome'}`, colWidth - 6), margin + 3, dataY + 32);

  const rightX = margin + colWidth + 8;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(rightX, dataY, colWidth, 38, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text('SPETT.LE', rightX + 3, dataY + 5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0);
  const customerName = estimate.customer?.name || '— Cliente non specificato —';
  const wrappedName = pdf.splitTextToSize(customerName, colWidth - 6);
  pdf.text(wrappedName, rightX + 3, dataY + 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  let cyc = dataY + 12 + wrappedName.length * 5;
  if (estimate.customer?.address_line) { pdf.text(estimate.customer.address_line, rightX + 3, cyc); cyc += 4; }
  const cityChunk = [estimate.customer?.zip_code, estimate.customer?.city,
    estimate.customer?.province ? `(${estimate.customer.province})` : ''].filter(Boolean).join(' ');
  if (cityChunk) { pdf.text(cityChunk, rightX + 3, cyc); cyc += 4; }
  if (estimate.customer?.vat_number) { pdf.text(`P.IVA ${estimate.customer.vat_number}`, rightX + 3, cyc); cyc += 4; }
  else if (estimate.customer?.fiscal_code) { pdf.text(`C.F. ${estimate.customer.fiscal_code}`, rightX + 3, cyc); cyc += 4; }
  pdf.setTextColor(0);

  let yAfterData = dataY + 45;
  if (estimate.description) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Oggetto:', margin, yAfterData);
    pdf.setFont('helvetica', 'normal');
    const wrappedDesc = pdf.splitTextToSize(estimate.description, contentWidth);
    pdf.text(wrappedDesc, margin, yAfterData + 5);
    yAfterData += 5 + wrappedDesc.length * 5 + 4;
  }
  if (estimate.notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Note:', margin, yAfterData);
    pdf.setFont('helvetica', 'normal');
    const wrappedNotes = pdf.splitTextToSize(estimate.notes, contentWidth);
    pdf.text(wrappedNotes, margin, yAfterData + 5);
    yAfterData += 5 + wrappedNotes.length * 5 + 4;
  }

  // Tabella sintetica stratigrafie con prezzo vendita
  const sellingPerSqmAvg = costBase.totalArea && costBase.totalArea > 0
    ? breakdown.grossPrice / costBase.totalArea : 0;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Composizione offerta', margin, yAfterData + 4);

  autoTable(pdf, {
    startY: yAfterData + 8,
    head: [['#', 'Stratigrafia', 'm²', '€/m²', 'Totale']],
    body: stratigraphies.map((s, i) => {
      const area = num(s.area, 0);
      return [
        String(i + 1),
        s.name || '—',
        area.toFixed(2),
        euro(sellingPerSqmAvg),
        euro(sellingPerSqmAvg * area),
      ];
    }),
    foot: [['', 'TOTALE OFFERTA', costBase.totalArea?.toFixed(2) ?? '0', '', euro(breakdown.grossPrice)]],
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: PRIMARY_RGB },
    footStyles: { fillColor: [230, 240, 250], textColor: 0, fontStyle: 'bold' },
  });

  // ========== PAGINE 2..N: DETTAGLIO STRATIGRAFIE ==========
  for (let idx = 0; idx < stratigraphies.length; idx++) {
    const strat = stratigraphies[idx];
    Sentry.addBreadcrumb({
      category: 'pdf.complete', message: 'strat detail', level: 'info',
      data: { idx, name: strat?.name },
    });
    pdf.addPage();
    const cy = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(...PRIMARY_RGB);
    pdf.text(`${idx + 1}. ${strat.name || '—'}`, margin, cy + 10);
    pdf.setTextColor(0);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    const area = num(strat.area, 0);
    pdf.text(
      `Area: ${area.toFixed(2)} m² · €/m²: ${euro(sellingPerSqmAvg)} · Totale: ${euro(sellingPerSqmAvg * area)}`,
      margin, cy + 17,
    );
    pdf.setTextColor(0);

    // Performance grid (se certificata)
    const perfRows = performanceRows(strat);
    let yAfter = cy + 22;
    if (perfRows.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Caratteristiche tecniche', margin, yAfter + 4);
      yAfter = drawPerformanceGrid(pdf, margin, yAfter + 7, contentWidth, perfRows);
      yAfter += 4;
    }

    // Composizione layer (cantiere/tecnico vuole vederla)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Composizione (sezione)', margin, yAfter + 2);

    const layers = getLayersOf(strat);
    const body = layers.map((layer, layerIdx) => {
      const mat = getMatOf(layer);
      if (!mat) return [String(layerIdx + 1), '— (vuoto)', '—', '—', '—'];
      const category = CATEGORY_LABEL[String(mat.category ?? '')] ?? String(mat.category ?? '');
      const thickness = num(layer.thickness ?? mat.thickness);
      const name = String(mat.name ?? '—');
      const supplier = String(mat.supplier ?? '');
      const unitPrice = num(mat.unit_price);
      return [
        String(layerIdx + 1), category,
        name + (supplier ? ` (${supplier})` : ''),
        thickness > 0 ? `${thickness} mm` : '—',
        unitPrice > 0 ? `${euro(unitPrice)} /${String(mat.unit ?? 'mq')}` : '—',
      ];
    });

    autoTable(pdf, {
      startY: yAfter + 6,
      head: [['#', 'Categoria', 'Materiale', 'Spessore', 'Prezzo unit.']],
      body,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: PRIMARY_RGB },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 28 }, 3: { cellWidth: 22 }, 4: { cellWidth: 32 } },
    });
  }

  // ========== PAGINA: RIEPILOGO MATERIALI DA ACQUISTARE ==========
  pdf.addPage();
  const summaryY = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(...PRIMARY_RGB);
  pdf.text('Riepilogo materiali da acquistare', margin, summaryY + 8);
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text('Quantità aggregate da tutte le stratigrafie con sfridi applicati.', margin, summaryY + 14);
  pdf.setTextColor(0);

  const aggregated = aggregateMaterials(stratigraphies);
  const grouped = new Map<string, AggregatedMaterial[]>();
  for (const m of aggregated) {
    const arr = grouped.get(m.category) ?? [];
    arr.push(m);
    grouped.set(m.category, arr);
  }
  let lastY = summaryY + 18;
  let totalMaterialsCost = 0;
  for (const category of CATEGORY_ORDER) {
    const items = grouped.get(category);
    if (!items || items.length === 0) continue;
    const categoryTotal = items.reduce((s, i) => s + i.totalCost, 0);
    totalMaterialsCost += categoryTotal;
    autoTable(pdf, {
      startY: lastY + 4,
      head: [[
        { content: `${CATEGORY_LABEL[category]} — ${euro(categoryTotal)}`, colSpan: 6, styles: { fillColor: PRIMARY_RGB, textColor: 255 } },
      ], ['Materiale', 'Codice', 'Fornitore', 'Sfrido', 'Qtà acquisto', 'Costo']],
      body: items.map(i => [
        i.name, i.code, i.supplier,
        i.wastePct > 0 ? `+${i.wastePct}%` : '—',
        `${i.purchaseQty < 10 ? i.purchaseQty.toFixed(2) : Math.round(i.purchaseQty)} ${i.unit}`,
        euro(i.totalCost),
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: SECONDARY_RGB, textColor: 255 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (pdf as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? lastY;
    if (lastY > pageHeight - 50) {
      pdf.addPage();
      lastY = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });
    }
  }

  // ========== PAGINA FINALE: SOMMARIO + PIE + PAGAMENTI + TERMINI ==========
  if (lastY > pageHeight - 100) {
    pdf.addPage();
    lastY = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(...PRIMARY_RGB);
  pdf.text('Sommario economico', margin, lastY + 10);
  pdf.setTextColor(0);

  // Pie chart breakdown
  const slices = [
    { label: 'Materiali', value: breakdown.costMaterials + breakdown.markupMaterials, color: PRIMARY_RGB as [number, number, number] },
    { label: 'Manodopera', value: breakdown.costLabor + breakdown.markupLabor, color: SECONDARY_RGB as [number, number, number] },
    { label: 'Finitura', value: breakdown.costFinish + breakdown.markupFinish, color: ACCENT_RGB as [number, number, number] },
    { label: 'Spese accessorie', value: breakdown.accessoriesTotal, color: [120, 140, 100] as [number, number, number] },
  ].filter(s => s.value > 0.01);
  drawPieChart(pdf, margin + 30, lastY + 40, 18, slices);
  drawPieLegend(pdf, margin + 60, lastY + 28, slices, euro);

  // Tabella sommario IVA
  autoTable(pdf, {
    startY: lastY + 70,
    head: [['Voce', 'Importo']],
    body: [
      ['Imponibile (con sconto applicato)', euro(breakdown.netPrice)],
      [`IVA ${breakdown.ivaPct}%`, euro(breakdown.ivaAmount)],
    ],
    foot: [['TOTALE OFFERTA', euro(breakdown.totalPrice)]],
    theme: 'plain',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    footStyles: { fillColor: PRIMARY_RGB, textColor: 255, fontStyle: 'bold', fontSize: 13 },
    columnStyles: { 0: { cellWidth: 110 }, 1: { halign: 'right' } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yAfterTot = (pdf as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? lastY + 90;

  // Scaletta pagamenti
  const advancePct = num(org?.payment_advance_pct, PRICING_DEFAULTS.payment_advance_pct);
  const midPct = num(org?.payment_mid_pct, PRICING_DEFAULTS.payment_mid_pct);
  const balancePct = num(org?.payment_balance_pct, PRICING_DEFAULTS.payment_balance_pct);
  const totFinal = breakdown.totalPrice;
  if (advancePct + midPct + balancePct > 0) {
    if (yAfterTot > pageHeight - 50) {
      pdf.addPage();
      yAfterTot = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Modalità di pagamento', margin, yAfterTot + 10);
    autoTable(pdf, {
      startY: yAfterTot + 14,
      head: [['Fase', '%', 'Importo']],
      body: [
        [`Acconto all'ordine`, `${advancePct}%`, euro((totFinal * advancePct) / 100)],
        [`A metà lavori`, `${midPct}%`, euro((totFinal * midPct) / 100)],
        [`Saldo a fine lavori`, `${balancePct}%`, euro((totFinal * balancePct) / 100)],
      ],
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: SECONDARY_RGB, textColor: 255 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yAfterTot = (pdf as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yAfterTot + 40;
  }

  // Termini consegna / garanzia
  if (org?.delivery_terms || org?.warranty_terms) {
    if (yAfterTot > pageHeight - 30) {
      pdf.addPage();
      yAfterTot = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Termini', margin, yAfterTot + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    let ty = yAfterTot + 15;
    if (org.delivery_terms) { pdf.text(`Consegna: ${org.delivery_terms}`, margin, ty); ty += 5; }
    if (org.warranty_terms) { pdf.text(`Garanzia: ${org.warranty_terms}`, margin, ty); ty += 5; }
    yAfterTot = ty;
  }

  // Note legali
  if (org?.terms_text) {
    if (yAfterTot > pageHeight - 60) {
      pdf.addPage();
      yAfterTot = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Note e condizioni', margin, yAfterTot + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(80);
    const wrapped = pdf.splitTextToSize(org.terms_text, contentWidth);
    pdf.text(wrapped, margin, yAfterTot + 16);
    pdf.setTextColor(0);
  }

  drawFooterOnAllPages({ pdf, pageWidth, pageHeight, org, offerNumber: estimate.offerNumber });

  Sentry.addBreadcrumb({ category: 'pdf.complete', message: 'save', level: 'info' });
  const filename = buildOfferFilename(estimate.projectName, estimate.name, 'completo');
  pdf.save(filename);
};
