
import * as XLSX from 'xlsx';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';

export const exportStratigraphyToExcel = (stratigraphy: DatabaseStratigraphy, layers?: any[]) => {
  const stratigraphyData = [
    ['DATI TECNICI STRATIGRAFIA', ''],
    ['Nome', stratigraphy.name],
    ['Descrizione', stratigraphy.description || 'N/A'],
    ['Tipologia', stratigraphy.type],
    ['Spessore Totale (mm)', stratigraphy.total_thickness],
    ['Peso (kg/m²)', stratigraphy.weight_per_sqm || 'N/A'],
    ['Prestazione Termica', stratigraphy.thermal_performance || 'N/A'],
    ['Prestazione Acustica', stratigraphy.acoustic_performance || 'N/A'],
    ['Classe Resistenza al Fuoco', stratigraphy.fire_resistance_class || 'N/A'],
    ['Costo per m²', stratigraphy.cost_per_sqm || 'N/A'],
    ['Tempo Installazione per m²', stratigraphy.installation_time_per_sqm || 'N/A'],
    ['Certificata', stratigraphy.is_certified ? 'Sì' : 'No'],
    [''],
  ];
  
  if (layers && layers.length > 0) {
    stratigraphyData.push(['LAYERS', '']);
    stratigraphyData.push(['Posizione', 'Materiale', 'Spessore (mm)']);
    
    layers.forEach(layer => {
      stratigraphyData.push([
        layer.position,
        layer.materialName || 'N/A',
        layer.thickness
      ]);
    });
  }
  
  const ws = XLSX.utils.aoa_to_sheet(stratigraphyData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stratigrafia');
  
  XLSX.writeFile(wb, `stratigrafia_${stratigraphy.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
};
