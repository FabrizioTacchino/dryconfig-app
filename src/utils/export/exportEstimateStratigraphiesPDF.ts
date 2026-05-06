
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Estimate } from '@/types';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

export const exportEstimateStratigraphiesToPDF = async (
  estimate: Estimate,
  stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[]
) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(57, 99, 175); // blu
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('PREVENTIVO STRATIGRAFIE', 12, 15);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text(`Nome Preventivo: ${estimate.name}`, 12, 30);
  doc.text(`Descrizione: ${estimate.description || 'N/A'}`, 12, 38);
  doc.text(`Data creazione: ${estimate.createdAt?.toLocaleDateString?.('it-IT') ?? ''}`, 12, 46);

  doc.setDrawColor(150);
  doc.line(10, 52, 200, 52);

  // Tabella dettagli stratigrafie
  const columns: any[] = [
    { header: "Nome", dataKey: "name" },
    { header: "Descrizione", dataKey: "description" },
    { header: "Superficie (m²)", dataKey: "area" },
    { header: "Quantità", dataKey: "quantity" },
    { header: "Totale (€)", dataKey: "totalCost" },
    { header: "Tipo", dataKey: "type" },
    { header: "Spessore (mm)", dataKey: "thickness" },
    { header: "Certificata", dataKey: "cert" },
  ];

  const rows = stratigraphies.map((s) => ({
    name: s.name,
    description: (s.description || s.stratigraphy?.description || ''),
    area: typeof s.area === "number" ? s.area.toFixed(2) : '',
    quantity: typeof s.quantity === "number" ? s.quantity : '',
    totalCost: typeof s.totalCost === "number" ? `€ ${s.totalCost.toLocaleString('it-IT', {minimumFractionDigits: 2})}` : '',
    type: s.stratigraphy?.type || '',
    thickness: s.stratigraphy?.total_thickness ? `${s.stratigraphy.total_thickness}` : '',
    cert: s.stratigraphy?.is_certified ? "Sì" : "No"
  }));

  const autoTableResult = (autoTable as any)(doc, {
    startY: 58,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => row[c.dataKey])),
    headStyles: { fillColor: [57, 99, 175], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 50 },
    alternateRowStyles: { fillColor: [237, 242, 250] },
    margin: { left: 10, right: 10 },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      halign: 'center'
    },
    didDrawPage: function (data: any) {
      // Footer: numeri di pagina
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Pagina ${data.pageNumber} di ${pageCount}`, 200 - 20, 295, { align: 'right' });
    }
  });

  // Totale principale
  const sum = stratigraphies.reduce((sum, s) => sum + (typeof s.totalCost === "number" ? s.totalCost : 0), 0);
  doc.setTextColor(57, 99, 175);
  doc.setFontSize(13);
  const yForTotalText = (autoTableResult && autoTableResult.finalY) ? autoTableResult.finalY + 14 : 270;
  doc.text(`TOTALE PREVENTIVO: € ${sum.toLocaleString('it-IT', {minimumFractionDigits: 2})}`, 12, yForTotalText);

  // Data esportazione
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Esportato il: ${new Date().toLocaleString('it-IT')}`, 10, 295);

  // Download
  doc.save(`preventivo_stratigrafie_${estimate.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};
