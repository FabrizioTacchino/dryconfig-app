
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialSummaryItem } from '@/hooks/useMaterialsSummary';

export const exportMaterialsSummaryToPDF = (
  materials: MaterialSummaryItem[],
  estimateName: string,
  totalCost: number,
  totalLaborCost: number
) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(57, 99, 175);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('RIEPILOGO MATERIALI DA ACQUISTARE (RDA)', 12, 15);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text(`Preventivo: ${estimateName}`, 12, 35);
  doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 12, 43);
  doc.text(`Numero materiali: ${materials.length}`, 12, 51);

  // Riepilogo costi
  doc.setFontSize(12);
  doc.setTextColor(57, 99, 175);
  doc.text('RIEPILOGO COSTI', 12, 65);
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Costo Totale Materiali: €${totalCost.toFixed(2)}`, 12, 75);
  doc.text(`Costo Totale Manodopera: €${totalLaborCost.toFixed(2)}`, 12, 83);
  doc.setTextColor(57, 99, 175);
  doc.text(`TOTALE PREVENTIVO: €${(totalCost + totalLaborCost).toFixed(2)}`, 12, 91);

  doc.setDrawColor(150);
  doc.line(10, 97, 200, 97);

  // Tabella materiali
  const tableColumns = [
    { header: "Categoria", dataKey: "category" },
    { header: "Materiale", dataKey: "materialName" },
    { header: "Codice", dataKey: "materialCode" },
    { header: "Fornitore", dataKey: "supplier" },
    { header: "Quantità", dataKey: "quantity" },
    { header: "Prezzo Unit.", dataKey: "unitPrice" },
    { header: "Totale", dataKey: "totalCost" }
  ];

  const tableRows = materials.map(material => ({
    category: material.category,
    materialName: material.materialName,
    materialCode: material.materialCode,
    supplier: material.supplier,
    quantity: `${material.totalQuantity.toFixed(2)} ${material.unit}`,
    unitPrice: `€${material.unitPrice.toFixed(2)}`,
    totalCost: `€${material.totalCost.toFixed(2)}`
  }));

  const autoTableResult = (autoTable as any)(doc, {
    startY: 103,
    head: [tableColumns.map(c => c.header)],
    body: tableRows.map(row => tableColumns.map(c => row[c.dataKey])),
    headStyles: { fillColor: [57, 99, 175], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 50, fontSize: 8 },
    alternateRowStyles: { fillColor: [237, 242, 250] },
    margin: { left: 10, right: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center'
    },
    didDrawPage: function (data: any) {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Pagina ${data.pageNumber} di ${pageCount}`, 200 - 20, 295, { align: 'right' });
    }
  });

  // Totale finale
  const yForTotalText = (autoTableResult && autoTableResult.finalY) ? autoTableResult.finalY + 14 : 270;
  doc.setTextColor(57, 99, 175);
  doc.setFontSize(12);
  doc.text(`TOTALE MATERIALI: €${totalCost.toFixed(2)}`, 12, yForTotalText);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, 10, 295);

  // Download
  doc.save(`RDA_${estimateName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};
