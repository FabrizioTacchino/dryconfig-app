
import * as XLSX from 'xlsx';
import { MaterialSummaryItem } from '@/hooks/useMaterialsSummary';

export const exportMaterialsSummaryToExcel = (
  materials: MaterialSummaryItem[],
  estimateName: string,
  totalCost: number,
  totalLaborCost: number
) => {
  // Dati di riepilogo
  const summaryData = [
    ['RIEPILOGO MATERIALI DA ACQUISTARE', ''],
    ['Preventivo', estimateName],
    ['Data esportazione', new Date().toLocaleDateString('it-IT')],
    ['Numero materiali', materials.length],
    ['Costo totale materiali', `€${totalCost.toFixed(2)}`],
    ['Costo totale manodopera', `€${totalLaborCost.toFixed(2)}`],
    ['Totale preventivo', `€${(totalCost + totalLaborCost).toFixed(2)}`],
    [''],
    ['DETTAGLIO MATERIALI', ''],
    ['Categoria', 'Materiale', 'Codice', 'Fornitore', 'Quantità', 'Unità', 'Prezzo Unit.', 'Totale', 'Usato in']
  ];

  // Aggiungere i materiali
  materials.forEach(material => {
    summaryData.push([
      material.category,
      material.materialName,
      material.materialCode,
      material.supplier,
      material.totalQuantity.toFixed(2),
      material.unit,
      `€${material.unitPrice.toFixed(2)}`,
      `€${material.totalCost.toFixed(2)}`,
      material.stratigraphyNames.join(', ')
    ]);
  });

  // Totale finale
  summaryData.push(['']);
  summaryData.push(['TOTALE MATERIALI', '', '', '', '', '', '', `€${totalCost.toFixed(2)}`, '']);

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Riepilogo Materiali');

  // Impostare larghezza colonne
  ws['!cols'] = [
    {wch: 15}, {wch: 30}, {wch: 15}, {wch: 20}, {wch: 12}, {wch: 8}, {wch: 12}, {wch: 12}, {wch: 40}
  ];

  // Download del file
  XLSX.writeFile(wb, `riepilogo_materiali_${estimateName.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
};
