/**
 * Export PDF "Ordine al fornitore" (F31).
 *
 * Target: ufficio acquisti / titolare impresa. Documento operativo da inviare
 * via mail al rappresentante del singolo fornitore (Saint-Gobain, Knauf,
 * Fassa Bortolo, ...). Per ogni fornitore una sezione propria con i suoi
 * dati di contatto e la lista dei materiali da ordinare per il cantiere.
 *
 * Layout:
 *  - Pagina 1 (indice): logo org + intestazione cantiere + lista fornitori
 *    con totale per fornitore (a colpo d'occhio "questo cantiere muove tot
 *    da SG, tot da Knauf, ...").
 *  - Pagina N (una per fornitore): header con dati supplier (logo se c'è,
 *    email, telefono, website) + tabella materiali raggruppati per categoria
 *    con codice articolo, EAN, quantità d'acquisto (scatole intere per le
 *    viti), prezzo unitario netto, totale.
 *
 * I prezzi nel PDF sono **netti scontati** (post customer_discount sul
 * materiale), coerenti con il riepilogo materiali a video. Sono i prezzi
 * di *acquisto* dell'impresa, NON i prezzi finali al cliente.
 *
 * Coerenza prezzi: usa direttamente `MaterialSummaryItem` già calcolato
 * da useMaterialsSummary — niente formule duplicate.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import type { Estimate } from '@/types';
import type { OrgProfile } from '@/hooks/useOrgSettings';
import type { MaterialSummaryItem } from '@/hooks/useMaterialsSummary';
import { Sentry } from '@/lib/sentry';
import {
  buildOfferFilename, loadImageDataUrl, drawHeader, drawFooterOnAllPages,
  PRIMARY_RGB, SECONDARY_RGB,
} from './pdfHelpers';

interface ExtendedEstimate extends Estimate {
  projectName?: string;
  offerNumber?: string | null;
  offerIssuedAt?: Date | null;
}

interface SupplierInfo {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
}

interface SupplierGroup {
  /** Chiave di raggruppamento: supplierId UUID oppure 'unassigned'. */
  key: string;
  /** Dati supplier risolti dal DB (null se chiave 'unassigned' o supplier sconosciuto). */
  supplier: SupplierInfo | null;
  /** Nome da mostrare: supplier.name oppure il testo legacy del primo item. */
  displayName: string;
  items: MaterialSummaryItem[];
  totalCost: number;
}

function euro(v: number): string {
  return `€ ${v.toFixed(2).replace('.', ',')}`;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatQty(item: MaterialSummaryItem): string {
  const q = num(item.totalQuantity);
  const unit = item.unit || 'pz';
  // Quantità intera per scatole/pezzi, 2 decimali per mq/ml/kg
  const isInteger = unit === 'scatola' || unit === 'pz' || unit === 'pezzo';
  const formatted = isInteger
    ? Math.round(q).toString()
    : q.toFixed(2).replace('.', ',');
  return `${formatted} ${unit}`;
}

/**
 * Raggruppa MaterialSummaryItem per supplierId e fetcha i dati supplier dal DB.
 * I materiali senza supplierId finiscono in un gruppo speciale "Non assegnato"
 * (caso edge: import legacy senza FK).
 */
async function buildSupplierGroups(
  materials: MaterialSummaryItem[],
): Promise<SupplierGroup[]> {
  const groupsMap = new Map<string, SupplierGroup>();

  for (const item of materials) {
    const key = item.supplierId ?? 'unassigned';
    let g = groupsMap.get(key);
    if (!g) {
      g = {
        key,
        supplier: null,
        displayName: item.supplier || 'Fornitore non specificato',
        items: [],
        totalCost: 0,
      };
      groupsMap.set(key, g);
    }
    g.items.push(item);
    g.totalCost += num(item.totalCost);
  }

  // Fetch dati supplier per le chiavi UUID
  const supplierIds = Array.from(groupsMap.keys()).filter(k => k !== 'unassigned');
  if (supplierIds.length > 0) {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, name, contact_email, contact_phone, website, logo_url, notes')
      .in('id', supplierIds);
    if (error) {
      // Non blocchiamo l'export: il PDF si genera senza i contatti del rappresentante.
      console.warn('[exportSupplierOrder] Failed to fetch suppliers:', error);
      Sentry.captureException(error, { tags: { feature: 'supplier-order', step: 'fetch-suppliers' } });
    } else if (suppliers) {
      for (const s of suppliers) {
        const g = groupsMap.get(s.id);
        if (g) {
          g.supplier = s as SupplierInfo;
          g.displayName = s.name;
        }
      }
    }
  }

  // Ordina: prima i fornitori con più totale (Saint-Gobain top), unassigned in fondo
  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.key === 'unassigned') return 1;
    if (b.key === 'unassigned') return -1;
    return b.totalCost - a.totalCost;
  });
}

interface ExportSupplierOrderArgs {
  estimate: ExtendedEstimate;
  materials: MaterialSummaryItem[];
  org: OrgProfile | null;
}

export async function exportSupplierOrder({
  estimate, materials, org,
}: ExportSupplierOrderArgs): Promise<void> {
  if (materials.length === 0) {
    throw new Error('Nessun materiale da ordinare: aggiungi prima le stratigrafie al preventivo.');
  }

  const groups = await buildSupplierGroups(materials);
  const orgLogoDataUrl = await loadImageDataUrl(org?.logo_url ?? null);

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;

  const grandTotal = groups.reduce((sum, g) => sum + g.totalCost, 0);

  // ============================================================
  // PAGINA 1 — Indice fornitori
  // ============================================================
  let y = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl: orgLogoDataUrl });

  y += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...PRIMARY_RGB);
  pdf.text('ORDINE AI FORNITORI', margin, y);
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(80);
  const cantiere = estimate.projectName || 'Cantiere';
  const preventivoName = estimate.name || 'Preventivo';
  pdf.text(`Cantiere: ${cantiere} · Preventivo: ${preventivoName}`, margin, y);
  y += 5;
  pdf.text(
    `Data: ${new Date().toLocaleDateString('it-IT')}${estimate.offerNumber ? ` · Rif. Offerta ${estimate.offerNumber}` : ''}`,
    margin, y,
  );
  y += 8;

  // Tabella indice
  autoTable(pdf, {
    startY: y,
    head: [['Fornitore', 'N° articoli', 'Totale netto']],
    body: groups.map(g => [
      g.displayName,
      g.items.length.toString(),
      euro(g.totalCost),
    ]),
    foot: [['TOTALE COMPLESSIVO', materials.length.toString(), euro(grandTotal)]],
    headStyles: { fillColor: PRIMARY_RGB, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: SECONDARY_RGB, textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  y = (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 10;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  const intro = pdf.splitTextToSize(
    'Il documento riporta i materiali da ordinare per il presente cantiere, raggruppati per fornitore. ' +
    'Le quantità includono lo sfrido configurato e, dove applicabile, l\'arrotondamento a confezioni intere. ' +
    'I prezzi indicati sono netti di acquisto (post sconto applicato dal fornitore).',
    pageWidth - 2 * margin,
  );
  pdf.text(intro, margin, y);

  // ============================================================
  // UNA PAGINA PER FORNITORE
  // ============================================================
  for (const g of groups) {
    pdf.addPage();
    let py = drawHeader({ pdf, pageWidth, margin, org, logoDataUrl: orgLogoDataUrl });
    py += 4;

    // Titolo sezione
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(...PRIMARY_RGB);
    pdf.text(`Ordine: ${g.displayName}`, margin, py);
    py += 7;

    // Box dati supplier
    const s = g.supplier;
    if (s) {
      const contactLines: string[] = [];
      if (s.contact_email) contactLines.push(`Email: ${s.contact_email}`);
      if (s.contact_phone) contactLines.push(`Tel: ${s.contact_phone}`);
      if (s.website) contactLines.push(`Web: ${s.website}`);

      if (contactLines.length > 0) {
        const boxHeight = contactLines.length * 5 + 6;
        pdf.setDrawColor(...SECONDARY_RGB);
        pdf.setFillColor(245, 248, 252);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, py, pageWidth - 2 * margin, boxHeight, 2, 2, 'FD');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(60);
        let cy = py + 5;
        for (const line of contactLines) {
          pdf.text(line, margin + 4, cy);
          cy += 5;
        }
        py += boxHeight + 4;
      }
    } else if (g.key === 'unassigned') {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(
        'Materiali senza fornitore strutturato in anagrafica. Aggiorna i materiali per associarli a un supplier.',
        margin, py,
      );
      py += 6;
    }

    // Sotto-totale + numero articoli
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0);
    pdf.text(`${g.items.length} articoli · Totale netto: ${euro(g.totalCost)}`, margin, py);
    py += 4;

    // Tabella materiali per questo fornitore — raggruppati visivamente per categoria
    const sortedItems = [...g.items].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.materialName.localeCompare(b.materialName);
    });

    autoTable(pdf, {
      startY: py + 3,
      head: [['Categoria', 'Codice', 'EAN', 'Articolo', 'Q.tà', '€/unit.', 'Totale']],
      body: sortedItems.map(it => [
        it.category,
        it.materialCode || '—',
        it.ean || '—',
        it.materialName,
        formatQty(it),
        euro(num(it.unitPrice)),
        euro(num(it.totalCost)),
      ]),
      foot: [['', '', '', '', '', 'TOTALE', euro(g.totalCost)]],
      headStyles: { fillColor: PRIMARY_RGB, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: SECONDARY_RGB, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        // Evidenzia il cambio di categoria con uno sfondo molto leggero.
        if (data.section === 'body' && data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    // Note supplier se presenti
    if (s?.notes) {
      const ny = (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? py;
      if (ny < pageHeight - 30) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        const noteLines = pdf.splitTextToSize(`Note fornitore: ${s.notes}`, pageWidth - 2 * margin);
        pdf.text(noteLines, margin, ny + 6);
      }
    }
  }

  // Footer su tutte le pagine
  drawFooterOnAllPages({
    pdf, pageWidth, pageHeight, org, offerNumber: estimate.offerNumber,
  });

  // Salva
  const filename = buildOfferFilename(
    estimate.projectName,
    estimate.name,
    'ordine_fornitori',
  );
  pdf.save(filename);
}
