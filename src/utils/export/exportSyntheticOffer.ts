/**
 * Export PDF "Preventivo Sintetico" (F26).
 *
 * Target: cliente decisore (committente, architetto). Documento di vendita,
 * sintetico, ~2-4 pagine.
 *
 * Layout:
 *  - Pagina 1 (cover): logo grande, dati org, dati cliente, numero offerta,
 *    data emissione, validità, totale in evidenza
 *  - Pagina 2..N: una pagina per stratigrafia con caratteristiche chiave
 *    (€/m², area, totale, performance certificate se applicabile)
 *  - Pagina finale: sommario costi con pie chart + scaletta pagamenti +
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

/** Aggrega CostBase dal preventivo, leggendo i costi unitari di ogni strat. */
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
    const matPerSqm = num(inner.material_cost_per_sqm);
    const screwPerSqm = num(inner.screw_cost_per_sqm);
    const laborPerSqm = num(inner.labor_cost_per_sqm);
    materials += (matPerSqm + screwPerSqm) * area;
    labor += laborPerSqm * area;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = (s as any).finishCostPerSqm;
    if (f != null) finish += num(f) * area;
  }
  return { materials, labor, finish, totalArea };
}

/** Estrae righe performance per box certificate, solo se valori sensati. */
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

export interface SyntheticOfferOptions {
  estimate: ExtendedEstimate;
  stratigraphies: StratigraphyWithLayers[];
  org: OrgProfile | null;
}

export async function exportSyntheticOffer(opts: SyntheticOfferOptions): Promise<void> {
  const { estimate, stratigraphies, org } = opts;

  Sentry.addBreadcrumb({
    category: 'pdf.synthetic',
    message: 'start',
    level: 'info',
    data: { estimateId: estimate?.id, count: stratigraphies?.length },
  });

  if (!estimate?.id) throw new Error('Preventivo non valido');
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

  // ============================================================================
  // PAGINA 1 — COVER
  // ============================================================================

  let yStart = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl, bigLogo: true });

  // Banner "PREVENTIVO" + numero
  pdf.setFillColor(...PRIMARY_RGB);
  pdf.rect(margin, yStart + 5, contentWidth, 14, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(255);
  pdf.text('PREVENTIVO', margin + 5, yStart + 15);
  if (estimate.offerNumber) {
    pdf.setFontSize(12);
    pdf.text(estimate.offerNumber, pageWidth - margin - 5, yStart + 15, { align: 'right' });
  }
  pdf.setTextColor(0);

  // Dati offerta + cliente in due colonne
  const colWidth = (contentWidth - 8) / 2;
  const dataY = yStart + 25;

  // Colonna sinistra: dati offerta
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
  pdf.text(`Validità: ${validityDays} giorni (fino al ${safeDate(validUntil)})`, margin + 3, dataY + 18);
  if (estimate.projectName) {
    const lbl = `Commessa: ${estimate.projectName}`;
    const wrapped = pdf.splitTextToSize(lbl, colWidth - 6);
    pdf.text(wrapped, margin + 3, dataY + 24);
  }
  pdf.setFont('helvetica', 'bold');
  const lbl = `Riferimento: ${estimate.name || 'Senza nome'}`;
  const wrappedRef = pdf.splitTextToSize(lbl, colWidth - 6);
  pdf.text(wrappedRef, margin + 3, dataY + 32);

  // Colonna destra: cliente
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
  if (estimate.customer?.address_line) {
    pdf.text(estimate.customer.address_line, rightX + 3, cyc);
    cyc += 4;
  }
  const cityChunk = [estimate.customer?.zip_code, estimate.customer?.city,
    estimate.customer?.province ? `(${estimate.customer.province})` : ''].filter(Boolean).join(' ');
  if (cityChunk) {
    pdf.text(cityChunk, rightX + 3, cyc);
    cyc += 4;
  }
  if (estimate.customer?.vat_number) {
    pdf.text(`P.IVA ${estimate.customer.vat_number}`, rightX + 3, cyc);
    cyc += 4;
  } else if (estimate.customer?.fiscal_code) {
    pdf.text(`C.F. ${estimate.customer.fiscal_code}`, rightX + 3, cyc);
    cyc += 4;
  }
  pdf.setTextColor(0);

  // Descrizione preventivo (se presente)
  let yAfterData = dataY + 45;
  if (estimate.description) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Oggetto:', margin, yAfterData);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const wrappedDesc = pdf.splitTextToSize(estimate.description, contentWidth);
    pdf.text(wrappedDesc, margin, yAfterData + 5);
    yAfterData += 5 + wrappedDesc.length * 5 + 4;
  }

  // Tabella sintetica stratigrafie con €/m² (vendita)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Composizione offerta', margin, yAfterData + 4);

  // Per ogni stratigrafia calcoliamo il €/m² vendita (mark-up applicato)
  // Approccio: calcoliamo il costo unitario di vendita medio, poi rapportiamo.
  const sellingPerSqmAvg = costBase.totalArea && costBase.totalArea > 0
    ? breakdown.grossPrice / costBase.totalArea
    : 0;

  autoTable(pdf, {
    startY: yAfterData + 8,
    head: [['#', 'Stratigrafia', 'm²', '€/m²', 'Totale']],
    body: stratigraphies.map((s, i) => {
      const area = num(s.area, 0);
      // Per ora applichiamo il rapporto medio (semplificazione corretta a livello aggregato)
      const sellingEurPerSqm = sellingPerSqmAvg;
      const sellingTotal = sellingEurPerSqm * area;
      return [
        String(i + 1),
        s.name || '—',
        area.toFixed(2),
        euro(sellingEurPerSqm),
        euro(sellingTotal),
      ];
    }),
    foot: [['', 'TOTALE OFFERTA', costBase.totalArea?.toFixed(2) ?? '0', '', euro(breakdown.grossPrice)]],
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: PRIMARY_RGB, textColor: 255 },
    footStyles: { fillColor: [230, 240, 250], textColor: 0, fontStyle: 'bold' },
  });

  // Box totale finale in evidenza
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (pdf as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;
  const totalBoxY = Math.max(finalY + 8, pageHeight - 60);
  if (totalBoxY < pageHeight - 30) {
    pdf.setFillColor(...PRIMARY_RGB);
    pdf.rect(margin, totalBoxY, contentWidth, 25, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(220, 230, 240);
    pdf.text('Totale offerta IVA inclusa', margin + 5, totalBoxY + 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(255);
    pdf.text(euro(breakdown.totalPrice), pageWidth - margin - 5, totalBoxY + 17, { align: 'right' });
    pdf.setTextColor(0);
  }

  // ============================================================================
  // PAGINE 2..N — DETTAGLIO PER STRATIGRAFIA
  // ============================================================================

  for (let idx = 0; idx < stratigraphies.length; idx++) {
    const strat = stratigraphies[idx];
    pdf.addPage();
    const cy = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(...PRIMARY_RGB);
    pdf.text(`${idx + 1}. ${strat.name || 'Stratigrafia'}`, margin, cy + 10);
    pdf.setTextColor(0);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    if (strat.description) {
      const wrapped = pdf.splitTextToSize(strat.description, contentWidth);
      pdf.text(wrapped, margin, cy + 17);
    }
    pdf.setTextColor(0);

    // Box performance se certificata
    const perfRows = performanceRows(strat);
    let yAfterPerf = cy + 25;
    if (perfRows.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Caratteristiche tecniche', margin, yAfterPerf);
      yAfterPerf = drawPerformanceGrid(pdf, margin, yAfterPerf + 4, contentWidth, perfRows);
      yAfterPerf += 4;
    }

    // Riepilogo costo della stratigrafia
    const area = num(strat.area, 0);
    const sellingEurPerSqm = sellingPerSqmAvg; // semplificazione: rapporto medio
    const sellingTotal = sellingEurPerSqm * area;

    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yAfterPerf, contentWidth, 28, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text('Superficie', margin + 5, yAfterPerf + 6);
    pdf.text('Prezzo unitario', margin + 5 + 50, yAfterPerf + 6);
    pdf.text('Totale stratigrafia', pageWidth - margin - 5, yAfterPerf + 6, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0);
    pdf.text(`${area.toFixed(2)} m²`, margin + 5, yAfterPerf + 16);
    pdf.text(euro(sellingEurPerSqm), margin + 5 + 50, yAfterPerf + 16);
    pdf.setTextColor(...PRIMARY_RGB);
    pdf.text(euro(sellingTotal), pageWidth - margin - 5, yAfterPerf + 16, { align: 'right' });
    pdf.setTextColor(0);
  }

  // ============================================================================
  // PAGINA FINALE — SOMMARIO + PAGAMENTI + TERMINI
  // ============================================================================

  pdf.addPage();
  const sumY = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...PRIMARY_RGB);
  pdf.text('Sommario economico', margin, sumY + 10);
  pdf.setTextColor(0);

  // Pie chart costi (parete / finitura / manodopera) — composizione del prezzo
  const slices = [
    { label: 'Materiali', value: breakdown.costMaterials + breakdown.markupMaterials, color: PRIMARY_RGB as [number, number, number] },
    { label: 'Manodopera', value: breakdown.costLabor + breakdown.markupLabor, color: SECONDARY_RGB as [number, number, number] },
    { label: 'Finitura', value: breakdown.costFinish + breakdown.markupFinish, color: ACCENT_RGB as [number, number, number] },
    { label: 'Spese accessorie', value: breakdown.accessoriesTotal, color: [120, 140, 100] as [number, number, number] },
  ].filter(s => s.value > 0.01);

  const pieY = sumY + 25;
  drawPieChart(pdf, margin + 30, pieY + 20, 18, slices);
  drawPieLegend(pdf, margin + 60, pieY + 8, slices, euro);

  // Tabella scaletta pagamenti
  const advancePct = num(org?.payment_advance_pct, PRICING_DEFAULTS.payment_advance_pct);
  const midPct = num(org?.payment_mid_pct, PRICING_DEFAULTS.payment_mid_pct);
  const balancePct = num(org?.payment_balance_pct, PRICING_DEFAULTS.payment_balance_pct);
  const totFinal = breakdown.totalPrice;

  autoTable(pdf, {
    startY: pieY + 50,
    head: [['Voce', 'Importo']],
    body: [
      ['Imponibile', euro(breakdown.netPrice)],
      [`IVA ${breakdown.ivaPct}%`, euro(breakdown.ivaAmount)],
    ],
    foot: [['TOTALE OFFERTA', euro(totFinal)]],
    theme: 'plain',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    footStyles: { fillColor: PRIMARY_RGB, textColor: 255, fontStyle: 'bold', fontSize: 13 },
    columnStyles: { 0: { cellWidth: 110 }, 1: { halign: 'right' } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yAfterTot = (pdf as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? pieY + 100;

  // Scaletta pagamenti
  if (advancePct + midPct + balancePct > 0) {
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
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Termini', margin, yAfterTot + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    let ty = yAfterTot + 15;
    if (org.delivery_terms) {
      pdf.text(`Consegna: ${org.delivery_terms}`, margin, ty);
      ty += 5;
    }
    if (org.warranty_terms) {
      pdf.text(`Garanzia: ${org.warranty_terms}`, margin, ty);
      ty += 5;
    }
    yAfterTot = ty;
  }

  // Note legali (terms_text)
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

  // Footer
  drawFooterOnAllPages({ pdf, pageWidth, pageHeight, org, offerNumber: estimate.offerNumber });

  Sentry.addBreadcrumb({ category: 'pdf.synthetic', message: 'save', level: 'info' });
  const filename = buildOfferFilename(estimate.projectName, estimate.name, 'sintetico');
  pdf.save(filename);
}
