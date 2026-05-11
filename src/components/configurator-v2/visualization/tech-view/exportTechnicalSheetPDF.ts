import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LayerV2, StratigraphyTypology } from '../../types';

interface ExportPdfOptions {
  layers: LayerV2[];
  studSpacingMm: number;
  systemCode?: string;
  typology: StratigraphyTypology;
  wallThicknessMm: number;
  totalWeightKgSqm: number;
  totalCostPerSqm: number;
  bestRwDb?: number;
  fireClasses?: string[];
  avgLambda?: number | null;
  stratigraphyName: string;
  stratigraphyDescription?: string;
  /** Elemento DOM contenente l'SVG della sezione tecnica. Se passato, viene
   *  rasterizzato e inserito nel PDF. */
  sectionSvgElement?: HTMLElement | SVGSVGElement | null;
}

const TIPOLOGY_IT: Record<StratigraphyTypology, string> = {
  partition: 'Parete divisoria interna a secco',
  lining: 'Controparete a secco',
  ceiling: 'Controsoffitto a secco',
  unknown: 'Sistema a secco personalizzato',
};

const CATEGORY_LABEL: Record<string, string> = {
  board: 'Lastra',
  structure_frame: 'Montante',
  structure_guide: 'Guida',
  insulation: 'Isolante',
  screw: 'Vite',
  finish: 'Finitura',
  ceiling_tile: 'Pannello',
  accessory: 'Accessorio',
};

/**
 * Rasterizza un SVG inline in PNG dataURL alla risoluzione richiesta.
 * Usa <canvas> + drawImage(svgBlob).
 *
 * Esportata anche per usi standalone (es. download PNG della sola sezione).
 */
export async function rasterizeSvg(svg: SVGSVGElement, scale = 2): Promise<string | null> {
  try {
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG image load failed'));
      img.src = url;
    });
    const vb = svg.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : svg.clientWidth || 1280;
    const h = vb && vb.height ? vb.height : svg.clientHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[exportTechnicalSheetPDF] rasterize SVG failed:', err);
    return null;
  }
}

/**
 * Genera e fa scaricare un PDF A4 della scheda tecnica della stratigrafia.
 * Stile catalogo: header, sezione raster, tabella materiali, prestazioni,
 * voce di capitolato, norme, footer.
 */
export async function exportTechnicalSheetPDF(opts: ExportPdfOptions): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let cursorY = margin;

  // ===== HEADER =====
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SCHEDA TECNICA · DryConfig', margin, 10);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.systemCode ?? 'DC-CUSTOM', margin, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(TIPOLOGY_IT[opts.typology], margin, 24);

  // Box spessore a destra
  const thickness = `${opts.wallThicknessMm.toFixed(0)} mm`;
  doc.setFontSize(8);
  doc.text('SPESSORE TOTALE', pageW - margin - 38, 10);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(thickness, pageW - margin, 22, { align: 'right' });

  cursorY = 34;
  doc.setTextColor(15, 23, 42);

  // ===== NOME STRATIGRAFIA =====
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.stratigraphyName || 'Stratigrafia personalizzata', margin, cursorY);
  cursorY += 5;
  if (opts.stratigraphyDescription) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(opts.stratigraphyDescription, margin, cursorY);
    cursorY += 5;
    doc.setTextColor(15, 23, 42);
  }
  cursorY += 2;

  // ===== SEZIONE RASTERIZZATA =====
  if (opts.sectionSvgElement && opts.sectionSvgElement instanceof SVGSVGElement) {
    const dataUrl = await rasterizeSvg(opts.sectionSvgElement, 2);
    if (dataUrl) {
      const svg = opts.sectionSvgElement;
      const vb = svg.viewBox.baseVal;
      const ratio = vb.height / Math.max(1, vb.width);
      const imgW = pageW - margin * 2;
      const imgH = imgW * ratio;
      // Limite altezza: max 90mm
      const finalH = Math.min(imgH, 90);
      const finalW = finalH / ratio;
      const cx = (pageW - finalW) / 2;
      doc.addImage(dataUrl, 'PNG', cx, cursorY, finalW, finalH, undefined, 'FAST');
      cursorY += finalH + 6;
    }
  }

  // ===== PRESTAZIONI (4 box) =====
  const perfData = [
    ['Resistenza al fuoco', opts.fireClasses?.length ? opts.fireClasses.join(' / ') : '—', 'EI'],
    ['Isolamento acustico', opts.bestRwDb ? `${Math.round(opts.bestRwDb)}` : '—', 'Rw dB'],
    ['Cond. termica', opts.avgLambda != null ? opts.avgLambda.toFixed(3) : '—', 'λ W/mK'],
    ['Peso specifico', opts.totalWeightKgSqm > 0 ? opts.totalWeightKgSqm.toFixed(1) : '—', 'kg/m²'],
  ];
  const perfBoxW = (pageW - margin * 2) / 4;
  doc.setDrawColor(226, 232, 240);
  perfData.forEach((row, i) => {
    const x = margin + perfBoxW * i;
    doc.rect(x, cursorY, perfBoxW, 18);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(row[0], x + perfBoxW / 2, cursorY + 5, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(String(row[1]), x + perfBoxW / 2, cursorY + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(row[2], x + perfBoxW / 2, cursorY + 16, { align: 'center' });
  });
  cursorY += 22;
  doc.setTextColor(15, 23, 42);

  // ===== TABELLA STRATIGRAFIA =====
  const tableBody = opts.layers.map((l, idx) => {
    const m = l.material;
    const t = l.thickness ?? m?.thickness ?? 0;
    return [
      String(idx + 1),
      m?.name ?? '—',
      CATEGORY_LABEL[m?.category ?? ''] ?? m?.category ?? '—',
      t > 0 ? `${Number(t).toFixed(1)} mm` : '—',
      m?.weight_per_sqm ? `${Number(m.weight_per_sqm).toFixed(2)} kg/m²` : '—',
      m?.supplier ?? '—',
    ];
  });
  autoTable(doc, {
    startY: cursorY,
    head: [['#', 'Materiale', 'Categoria', 'Spessore', 'Peso', 'Fornitore']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
    foot: [
      [
        '',
        'Totale',
        '',
        `${opts.wallThicknessMm.toFixed(1)} mm`,
        `${opts.totalWeightKgSqm.toFixed(2)} kg/m²`,
        '',
      ],
    ],
    footStyles: { fillColor: [249, 250, 251], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
  });
  cursorY = (doc as any).lastAutoTable.finalY + 6;

  // ===== INTERASSE / COSTO =====
  if (cursorY > pageH - 60) { doc.addPage(); cursorY = margin; }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Composizione struttura', margin, cursorY);
  cursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Interasse montanti: ${opts.studSpacingMm} mm`, margin, cursorY);
  cursorY += 4;
  doc.text(`Costo totale al m²: € ${opts.totalCostPerSqm.toFixed(2)}/m² (IVA esclusa)`, margin, cursorY);
  cursorY += 8;

  // ===== NORME =====
  if (cursorY > pageH - 50) { doc.addPage(); cursorY = margin; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Norme di riferimento', margin, cursorY);
  cursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const norms = [
    'UNI 11424:2015 — Sistemi a secco con lastre di gesso rivestito',
    'UNI EN 520 — Lastre di gesso rivestito (tipi e proprietà)',
    'UNI EN 13501-1 — Classificazione di reazione al fuoco',
    'UNI EN ISO 717-1 — Valutazione isolamento acustico',
    'UNI EN 14195 — Profili metallici per sistemi a secco',
    'UNI EN 13162 — Prodotti isolanti in lana minerale',
  ];
  norms.forEach(n => {
    if (cursorY > pageH - 15) { doc.addPage(); cursorY = margin; }
    doc.text(`· ${n}`, margin, cursorY);
    cursorY += 3.8;
  });

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'normal');
    const dt = new Date().toLocaleDateString('it-IT');
    doc.text(`Generato da DryConfig · ${dt}`, margin, pageH - 8);
    doc.text(`Pag. ${p}/${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  // Save
  const safeName = (opts.stratigraphyName || opts.systemCode || 'stratigrafia')
    .replace(/[^a-z0-9-_ ]/gi, '_')
    .trim() || 'stratigrafia';
  doc.save(`${safeName}.pdf`);
}
