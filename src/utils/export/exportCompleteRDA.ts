/**
 * Export PDF del preventivo completo "RDA" (Riepilogo Distinte e Analisi).
 *
 * Layout A4 professionale (F13 → F22):
 *  - Header con logo + ragione sociale + P.IVA + contatti su OGNI pagina
 *  - Pagina 1: copertina con info preventivo e sommario costi finale
 *  - Pagine 2..N: una pagina per stratigrafia con composizione tabellare
 *  - Pagina finale: riepilogo materiali da acquistare con sfridi
 *  - Footer con numero pagina + brand
 *
 * Usa jspdf + jspdf-autotable. Defensive contro dati mancanti — F22.1 fix:
 * tutti gli step sono wrap-pati e se uno fallisce un dato di un layer/strat,
 * registra il problema ma non blocca la generazione del PDF.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Estimate } from '@/types';
import type { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import type { OrgProfile } from '@/hooks/useOrgSettings';
import { Sentry } from '@/lib/sentry';

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

const PRIMARY_RGB: [number, number, number] = [40, 80, 130];
const SECONDARY_RGB: [number, number, number] = [80, 120, 170];

// ============================================================================
// Helpers
// ============================================================================

function getLayersOf(s: StratigraphyWithLayers): Array<Record<string, unknown>> {
  // Snapshot ha layersData (camelCase, valorizzato al create dell'estimate_strat)
  if (s.isSnapshot && Array.isArray(s.layersData)) return s.layersData;
  // Fallback: join dal catalog (poco probabile post-F5, ma supportiamo)
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

/**
 * Scarica un'immagine da URL e ritorna un dataURL base64 utilizzabile da
 * jsPDF.addImage. Necessario perché jsPDF lato browser non può scaricare
 * direttamente URL remoti — deve avere il blob in memoria.
 *
 * Gestisce CORS: Supabase Storage espone Access-Control-Allow-Origin: *,
 * quindi `fetch` funziona. Fallback null in caso di errore (PDF parte
 * senza logo invece di crashare).
 */
async function loadLogoDataUrl(url: string | undefined | null): Promise<string | null> {
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
    console.warn('[exportCompleteRDA] logo load failed:', err);
    return null;
  }
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
        if (!existing.stratigraphies.includes(stratName)) {
          existing.stratigraphies.push(stratName);
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
          stratigraphies: [stratName],
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
          if (!existingScrew.stratigraphies.includes(stratName)) {
            existingScrew.stratigraphies.push(stratName);
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
            stratigraphies: [stratName],
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
// Header / Footer reusable
// ============================================================================

interface RenderHeaderArgs {
  pdf: jsPDF;
  pageWidth: number;
  margin: number;
  org: OrgProfile | null;
  logoDataUrl: string | null;
}

/**
 * Disegna l'header sul TOP della pagina corrente (logo + ragione sociale +
 * P.IVA + contatti). Ritorna la Y a cui inizia il contenuto sotto.
 */
function renderHeader({ pdf, pageWidth, margin, org, logoDataUrl }: RenderHeaderArgs): number {
  const headerY = margin;
  const logoSize = 18; // mm — ridotto da 25 per non rubare spazio
  let textStartX = margin;

  if (logoDataUrl) {
    try {
      // Detect formato per jsPDF (PNG/JPEG/SVG sono i casi comuni; mappiamo
      // tutto a PNG come fallback perché jsPDF lo accetta universalmente)
      const fmt = logoDataUrl.startsWith('data:image/jpeg')
        ? 'JPEG'
        : logoDataUrl.startsWith('data:image/svg')
          ? 'PNG' // SVG non supportato → fallback testuale
          : 'PNG';
      if (fmt !== 'PNG' || !logoDataUrl.startsWith('data:image/svg')) {
        pdf.addImage(logoDataUrl, fmt, margin, headerY, logoSize, logoSize, undefined, 'FAST');
        textStartX = margin + logoSize + 5;
      }
    } catch (err) {
      console.warn('[exportCompleteRDA] addImage failed:', err);
    }
  }

  // Ragione sociale
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0);
  const companyName = org?.company_name?.trim() || org?.name?.trim() || 'DryConfig';
  pdf.text(companyName, textStartX, headerY + 5);

  // Indirizzo + P.IVA + contatti in due righe
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100);

  const line2Parts: string[] = [];
  if (org?.address_line) line2Parts.push(org.address_line);
  const cityChunk = [org?.zip_code, org?.city, org?.province ? `(${org.province})` : '']
    .filter(Boolean)
    .join(' ');
  if (cityChunk) line2Parts.push(cityChunk);
  if (line2Parts.length > 0) {
    pdf.text(line2Parts.join(' · '), textStartX, headerY + 10);
  }

  const line3Parts: string[] = [];
  if (org?.vat_number) line3Parts.push(`P.IVA ${org.vat_number}`);
  if (org?.phone) line3Parts.push(`Tel ${org.phone}`);
  if (org?.email) line3Parts.push(org.email);
  if (org?.website) line3Parts.push(org.website);
  if (line3Parts.length > 0) {
    const line3 = pdf.splitTextToSize(line3Parts.join(' · '), pageWidth - textStartX - margin);
    pdf.text(line3, textStartX, headerY + 14);
  }

  pdf.setTextColor(0);

  // Linea separatrice sotto l'header
  pdf.setDrawColor(...PRIMARY_RGB);
  pdf.setLineWidth(0.3);
  pdf.line(margin, headerY + logoSize + 2, pageWidth - margin, headerY + logoSize + 2);

  return headerY + logoSize + 6; // Y di inizio contenuto
}

// ============================================================================
// Export principale
// ============================================================================

export const exportCompleteRDA = async (
  estimate: Estimate,
  stratigraphies: StratigraphyWithLayers[],
  org: OrgProfile | null = null,
): Promise<void> => {
  // Breadcrumbs Sentry per debug se qualcosa fallisce in prod
  Sentry.addBreadcrumb({
    category: 'pdf.rda',
    message: 'export start',
    level: 'info',
    data: {
      estimateId: estimate?.id,
      stratCount: stratigraphies?.length ?? 0,
      hasOrg: !!org,
    },
  });

  if (!estimate || !estimate.id) {
    throw new Error('Preventivo non valido (manca id)');
  }
  if (!Array.isArray(stratigraphies)) {
    throw new Error('Lista stratigrafie non valida');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // ========== Carica logo (async, no-op se mancante) ==========
  const logoDataUrl = await loadLogoDataUrl(org?.logo_url);

  // Helper per renderizzare l'header sulla pagina corrente
  const drawHeader = () => renderHeader({ pdf, pageWidth, margin, org, logoDataUrl });

  // ========== PAGINA 1: COPERTINA ==========
  let yStart = drawHeader();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...PRIMARY_RGB);
  pdf.text('PREVENTIVO', margin, yStart + 12);
  pdf.setTextColor(0);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(estimate.name || 'Senza nome', margin, yStart + 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(80);
  pdf.text(`Data: ${safeDate(estimate.createdAt)}`, margin, yStart + 30);

  let yCursor = yStart + 38;
  if (estimate.description) {
    const wrappedDesc = pdf.splitTextToSize(`Descrizione: ${estimate.description}`, pageWidth - 2 * margin);
    pdf.text(wrappedDesc, margin, yCursor);
    yCursor += wrappedDesc.length * 5 + 3;
  }
  if (estimate.notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Note:', margin, yCursor);
    pdf.setFont('helvetica', 'normal');
    const wrappedNotes = pdf.splitTextToSize(estimate.notes, pageWidth - 2 * margin);
    pdf.text(wrappedNotes, margin, yCursor + 5);
    yCursor += wrappedNotes.length * 5 + 8;
  }
  pdf.setTextColor(0);

  // Tabella riepilogo stratigrafie
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Stratigrafie del preventivo', margin, yCursor + 5);

  const totMaterials = stratigraphies.reduce(
    (s, st) => s + num(st.unitCost) * num(st.area), 0,
  );

  Sentry.addBreadcrumb({ category: 'pdf.rda', message: 'cover table', level: 'info' });
  autoTable(pdf, {
    startY: yCursor + 10,
    head: [['#', 'Nome', 'Area (m²)', '€/m²', 'Totale']],
    body: stratigraphies.map((s, i) => [
      String(i + 1),
      s.name || '—',
      num(s.area).toFixed(2),
      euro(num(s.unitCost)),
      euro(num(s.unitCost) * num(s.area)),
    ]),
    foot: [['', 'TOTALE', stratigraphies.reduce((sum, s) => sum + num(s.area), 0).toFixed(2), '', euro(totMaterials)]],
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: PRIMARY_RGB },
    footStyles: { fillColor: [220, 230, 240], textColor: 0, fontStyle: 'bold' },
  });

  // ========== PAGINE 2..N: DETTAGLIO STRATIGRAFIE ==========
  for (let idx = 0; idx < stratigraphies.length; idx++) {
    const strat = stratigraphies[idx];
    Sentry.addBreadcrumb({
      category: 'pdf.rda',
      message: 'strat detail',
      level: 'info',
      data: { idx, name: strat?.name, area: strat?.area },
    });

    pdf.addPage();
    const contentY = drawHeader();

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(strat.name || '—', margin, contentY + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    pdf.text(
      `Area: ${num(strat.area).toFixed(2)} m² · €/m²: ${euro(num(strat.unitCost))} · Totale: ${euro(num(strat.unitCost) * num(strat.area))}`,
      margin, contentY + 15,
    );
    pdf.setTextColor(0);

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
        String(layerIdx + 1),
        category,
        name + (supplier ? ` (${supplier})` : ''),
        thickness > 0 ? `${thickness} mm` : '—',
        unitPrice > 0 ? `${euro(unitPrice)} /${String(mat.unit ?? 'mq')}` : '—',
      ];
    });

    autoTable(pdf, {
      startY: contentY + 22,
      head: [['#', 'Categoria', 'Materiale', 'Spessore', 'Prezzo unitario']],
      body,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: PRIMARY_RGB },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 32 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (pdf as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;
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
      pdf.text(
        `Costo totale (${num(strat.area).toFixed(2)} m²): ${euro(num(strat.unitCost) * num(strat.area))}`,
        margin, finalY + 30,
      );
    }
  }

  // ========== PAGINA FINALE: RIEPILOGO MATERIALI ==========
  Sentry.addBreadcrumb({ category: 'pdf.rda', message: 'materials summary', level: 'info' });
  pdf.addPage();
  const summaryY = drawHeader();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text('Riepilogo materiali da acquistare', margin, summaryY + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text(
    'Quantità aggregate da tutte le stratigrafie del preventivo, con sfridi applicati.',
    margin, summaryY + 14,
  );
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
        i.name,
        i.code,
        i.supplier,
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
      lastY = drawHeader();
    }
  }

  // ========== SOMMARIO FINALE ==========
  if (lastY > pageHeight - 80) {
    pdf.addPage();
    lastY = drawHeader();
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Sommario costi totali', margin, lastY + 15);

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
      ['Materiali (con sfridi)', euro(totMaterialsCost)],
      ['Manodopera', euro(totLabor)],
      ...(totFinish > 0 ? [['Finitura', euro(totFinish)] as [string, string]] : []),
    ],
    foot: [['TOTALE GENERALE', euro(totGen)]],
    theme: 'plain',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    footStyles: { fillColor: PRIMARY_RGB, textColor: 255, fontStyle: 'bold', fontSize: 13 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right' },
    },
  });

  // ========== FOOTER su tutte le pagine ==========
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    const orgName = org?.company_name || org?.name || 'DryConfig';
    pdf.text(
      `Pagina ${i} di ${pageCount} · ${orgName} · Generato con DryConfig · ${new Date().toLocaleDateString('it-IT')}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    );
    pdf.setTextColor(0);
  }

  // ========== Salva ==========
  Sentry.addBreadcrumb({ category: 'pdf.rda', message: 'save', level: 'info' });
  const safeName = (estimate.name || 'preventivo').replace(/[^a-z0-9_-]/gi, '_');
  pdf.save(`preventivo_${safeName}.pdf`);
};
