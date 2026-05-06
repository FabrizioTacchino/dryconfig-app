
import * as XLSX from 'xlsx';
import { Estimate } from '@/types';
import { EstimateWall } from '@/types/estimate';

export const exportEstimateToExcel = (estimate: Estimate, walls: EstimateWall[]) => {
  const wallTypeLabels = {
    plating: 'Placcatura',
    counterwall: 'Controparete',
    single: 'Parete singola',
    double: 'Parete doppia',
    ceiling: 'Controsoffitto',
  };
  
  // Dati del preventivo
  const estimateData = [
    ['PREVENTIVO', ''],
    ['Nome', estimate.name],
    ['Descrizione', estimate.description || 'N/A'],
    // AGGIUNGIAMO LE NOTE
    ['Note', estimate.notes || ''],
    ['Data', estimate.createdAt.toLocaleDateString('it-IT')],
    ['Versione', estimate.version],
    ['Stato', estimate.status],
    [''],
    ['PARETI DEL PREVENTIVO', ''],
    ['Nome', 'Tipologia', 'Area (m²)', 'Prezzo/m²', 'Costo Materiali', 'Costo Manodopera', 'Costo Accessori', 'Totale'],
  ];
  
  // Aggiungere le pareti
  walls.forEach(wall => {
    estimateData.push([
      wall.name,
      wallTypeLabels[wall.wallType],
      wall.area,
      wall.pricePerSqm,
      wall.materialCost,
      wall.laborCost,
      wall.accessoriesCost,
      wall.totalCost
    ]);
  });
  
  // Totale
  estimateData.push(['']);
  estimateData.push(['TOTALE PREVENTIVO', '', '', '', '', '', '', estimate.totalAmount]);
  
  const ws = XLSX.utils.aoa_to_sheet(estimateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Preventivo');
  
  // Download
  XLSX.writeFile(wb, `preventivo_${estimate.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
};
