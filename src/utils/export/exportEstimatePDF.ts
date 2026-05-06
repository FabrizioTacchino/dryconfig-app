import jsPDF from 'jspdf';
import { Estimate } from '@/types';
import { EstimateWall } from '@/types/estimate';

export const exportEstimateToPDF = async (estimate: Estimate, walls: EstimateWall[]) => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('PREVENTIVO', 20, 30);
  
  pdf.setFontSize(12);
  pdf.text(`Nome: ${estimate.name}`, 20, 50);
  pdf.text(`Descrizione: ${estimate.description || 'N/A'}`, 20, 60);
  // AGGIUNGIAMO LE NOTE
  if (estimate.notes && estimate.notes.trim()) {
    pdf.text(`Note: ${estimate.notes}`, 20, 70);
  }
  pdf.text(`Data: ${estimate.createdAt.toLocaleDateString('it-IT')}`, 20, estimate.notes ? 80 : 70);
  pdf.text(`Versione: ${estimate.version}`, 20, estimate.notes ? 90 : 80);
  
  // Tabella pareti
  let yPosition = 100;
  pdf.setFontSize(14);
  pdf.text('PARETI DEL PREVENTIVO', 20, yPosition);
  
  yPosition += 20;
  pdf.setFontSize(10);
  
  // Header tabella
  pdf.text('Nome', 20, yPosition);
  pdf.text('Tipologia', 70, yPosition);
  pdf.text('Area (m²)', 120, yPosition);
  pdf.text('Costo Totale', 160, yPosition);
  
  yPosition += 10;
  
  walls.forEach((wall) => {
    const wallTypeLabels = {
      plating: 'Placcatura',
      counterwall: 'Controparete',
      single: 'Parete singola',
      double: 'Parete doppia',
      ceiling: 'Controsoffitto',
    };
    
    pdf.text(wall.name, 20, yPosition);
    pdf.text(wallTypeLabels[wall.wallType], 70, yPosition);
    pdf.text(wall.area.toFixed(2), 120, yPosition);
    pdf.text(`€ ${wall.totalCost.toFixed(2)}`, 160, yPosition);
    
    yPosition += 10;
    
    // Nuova pagina se necessario
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }
  });
  
  // Totale
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.text(`TOTALE PREVENTIVO: € ${estimate.totalAmount.toFixed(2)}`, 20, yPosition);
  
  // Download
  pdf.save(`preventivo_${estimate.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};
