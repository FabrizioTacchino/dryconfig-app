/**
 * Helper condivisi per la generazione PDF (F26).
 *
 * - Caricamento logo async da URL → dataURL
 * - Render header con logo + dati org
 * - Render footer
 * - Disegno pie chart costi (jspdf primitives, no libreria extra)
 * - Box performance certificate
 * - Filename: {Commessa}_{Preventivo}_{Data}.pdf
 */
import jsPDF from 'jspdf';
import type { OrgProfile } from '@/hooks/useOrgSettings';

export const PRIMARY_RGB: [number, number, number] = [40, 80, 130];
export const SECONDARY_RGB: [number, number, number] = [80, 120, 170];
export const ACCENT_RGB: [number, number, number] = [220, 100, 50];

/**
 * Sostituisce caratteri non-filename con underscore. Mantiene maiuscole.
 */
export function sanitizeFilename(s: string | undefined | null): string {
  return (s ?? '').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Genera il filename canonico dei PDF preventivo:
 *   {Commessa}_{Preventivo}_{YYYY-MM-DD_HHMM}.pdf
 * Esempio: Cantiere_Roma_Preventivo_1_2026-05-13_1456.pdf
 */
export function buildOfferFilename(
  projectName: string | undefined | null,
  estimateName: string | undefined | null,
  variant?: 'sintetico' | 'completo',
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const parts = [
    sanitizeFilename(projectName) || 'Progetto',
    sanitizeFilename(estimateName) || 'Preventivo',
    `${date}_${time}`,
  ];
  if (variant) parts.push(variant);
  return parts.join('_') + '.pdf';
}

/**
 * Scarica un'immagine da URL e ritorna un dataURL base64 per jsPDF.addImage.
 */
export async function loadImageDataUrl(url: string | undefined | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[pdfHelpers.loadImageDataUrl]', err);
    return null;
  }
}

export interface DrawHeaderOptions {
  pdf: jsPDF;
  pageWidth: number;
  margin: number;
  org: OrgProfile | null;
  logoDataUrl: string | null;
  /** Se true, logo grande in stile cover (solo prima pagina). */
  bigLogo?: boolean;
}

/**
 * Disegna header (logo + dati org) sul TOP della pagina corrente.
 * Ritorna la Y di partenza del contenuto sotto.
 */
export function drawHeader({
  pdf, pageWidth, margin, org, logoDataUrl, bigLogo = false,
}: DrawHeaderOptions): number {
  const headerY = margin;
  const logoSize = bigLogo ? 32 : 18;
  let textStartX = margin;

  if (logoDataUrl) {
    try {
      const fmt = logoDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      pdf.addImage(logoDataUrl, fmt, margin, headerY, logoSize, logoSize, undefined, 'FAST');
      textStartX = margin + logoSize + 5;
    } catch (err) {
      console.warn('[pdfHelpers.drawHeader]', err);
    }
  }

  // Ragione sociale
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(bigLogo ? 14 : 11);
  pdf.setTextColor(0);
  const companyName = org?.company_name?.trim() || org?.name?.trim() || 'DryConfig';
  pdf.text(companyName, textStartX, headerY + (bigLogo ? 8 : 5));

  // Indirizzo + P.IVA + contatti
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(bigLogo ? 9 : 8);
  pdf.setTextColor(100);

  const lines: string[] = [];
  const line2: string[] = [];
  if (org?.address_line) line2.push(org.address_line);
  const cityChunk = [org?.zip_code, org?.city, org?.province ? `(${org.province})` : '']
    .filter(Boolean).join(' ');
  if (cityChunk) line2.push(cityChunk);
  if (line2.length) lines.push(line2.join(' · '));

  const line3: string[] = [];
  if (org?.vat_number) line3.push(`P.IVA ${org.vat_number}`);
  if (org?.phone) line3.push(`Tel ${org.phone}`);
  if (org?.email) line3.push(org.email);
  if (org?.website) line3.push(org.website);
  if (line3.length) lines.push(line3.join(' · '));

  const startTextY = headerY + (bigLogo ? 13 : 10);
  let y = startTextY;
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, pageWidth - textStartX - margin);
    pdf.text(wrapped, textStartX, y);
    y += wrapped.length * 4;
  }

  pdf.setTextColor(0);

  // Linea separatrice
  pdf.setDrawColor(...PRIMARY_RGB);
  pdf.setLineWidth(0.3);
  pdf.line(margin, headerY + logoSize + 2, pageWidth - margin, headerY + logoSize + 2);

  return headerY + logoSize + 6;
}

export interface DrawFooterOptions {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  org: OrgProfile | null;
  offerNumber?: string | null;
}

/**
 * Disegna footer su TUTTE le pagine del documento (chiamare a fine generazione).
 */
export function drawFooterOnAllPages({
  pdf, pageWidth, pageHeight, org, offerNumber,
}: DrawFooterOptions): void {
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    const orgName = org?.company_name || org?.name || 'DryConfig';
    const parts: string[] = [`Pagina ${i} di ${pageCount}`, orgName];
    if (offerNumber) parts.push(`Offerta ${offerNumber}`);
    parts.push(new Date().toLocaleDateString('it-IT'));
    pdf.text(parts.join(' · '), pageWidth / 2, pageHeight - 8, { align: 'center' });
    pdf.setTextColor(0);
  }
}

// ============================================================================
// Pie chart (jspdf primitives)
// ============================================================================

export interface PieSlice {
  label: string;
  value: number;
  color: [number, number, number];
}

/**
 * Disegna un pie chart al centro (cx, cy) con raggio r.
 * jsPDF non ha primitive nativi per archi → approssimiamo con triangoli
 * radiali (32 segmenti per slice).
 */
export function drawPieChart(
  pdf: jsPDF, cx: number, cy: number, r: number, slices: PieSlice[],
): void {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return;

  let startAngle = -Math.PI / 2; // partenza in alto (12 o'clock)
  for (const slice of slices) {
    if (slice.value <= 0) continue;
    const sweep = (slice.value / total) * Math.PI * 2;
    const endAngle = startAngle + sweep;
    pdf.setFillColor(...slice.color);
    pdf.setDrawColor(...slice.color);

    // Triangoli radiali (16 segmenti → curva visiva accettabile)
    const segments = Math.max(8, Math.ceil((sweep / (Math.PI * 2)) * 64));
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (sweep * i) / segments;
      const a2 = startAngle + (sweep * (i + 1)) / segments;
      const x1 = cx + Math.cos(a1) * r;
      const y1 = cy + Math.sin(a1) * r;
      const x2 = cx + Math.cos(a2) * r;
      const y2 = cy + Math.sin(a2) * r;
      pdf.triangle(cx, cy, x1, y1, x2, y2, 'FD');
    }

    startAngle = endAngle;
  }
}

/**
 * Disegna una legenda colorata sotto il pie chart, con quadrati colorati +
 * label + % + valore €.
 */
export function drawPieLegend(
  pdf: jsPDF,
  x: number,
  y: number,
  slices: PieSlice[],
  formatter?: (v: number) => string,
): number {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return y;
  const fmt = formatter ?? ((v: number) => v.toFixed(2));
  const rowHeight = 6;
  let cy = y;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  for (const slice of slices) {
    if (slice.value <= 0) continue;
    pdf.setFillColor(...slice.color);
    pdf.rect(x, cy - 3, 4, 4, 'F');
    pdf.setTextColor(40);
    const pct = ((slice.value / total) * 100).toFixed(1);
    pdf.text(`${slice.label}`, x + 6, cy);
    pdf.text(`${pct}% · ${fmt(slice.value)}`, x + 60, cy);
    cy += rowHeight;
  }
  pdf.setTextColor(0);
  return cy;
}

// ============================================================================
// Box performance certificate
// ============================================================================

export interface PerformanceBoxRow {
  label: string;
  value: string;
  unit?: string;
}

/**
 * Disegna una griglia 2×N di box con metriche tecniche (Rw, EI, λ, ecc.).
 * Useful when stratigraphy is certified.
 */
export function drawPerformanceGrid(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  rows: PerformanceBoxRow[],
): number {
  if (rows.length === 0) return y;
  const cols = 2;
  const boxW = (width - 4) / cols;
  const boxH = 14;
  let cy = y;
  for (let i = 0; i < rows.length; i += cols) {
    for (let c = 0; c < cols; c++) {
      const row = rows[i + c];
      if (!row) continue;
      const cx = x + c * (boxW + 4);
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(200, 210, 220);
      pdf.setLineWidth(0.2);
      pdf.rect(cx, cy, boxW, boxH, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(row.label, cx + 3, cy + 5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(...PRIMARY_RGB);
      const valueText = row.unit ? `${row.value} ${row.unit}` : row.value;
      pdf.text(valueText, cx + 3, cy + 11);
      pdf.setTextColor(0);
    }
    cy += boxH + 2;
  }
  return cy;
}
