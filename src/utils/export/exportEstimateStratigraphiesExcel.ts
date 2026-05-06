
import * as XLSX from 'xlsx';
import { Estimate } from '@/types';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

export const exportEstimateStratigraphiesToExcel = async (
  estimate: Estimate,
  stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[]
) => {
  // Riassunto
  const totalCost = stratigraphies.reduce((sum, s) => sum + (typeof s.totalCost === "number" ? s.totalCost : 0), 0);
  const totalArea = stratigraphies.reduce((sum, s) => sum + ((typeof s.area === "number" && typeof s.quantity === "number") ? s.area * s.quantity : 0), 0);

  const summaryRows = [
    ["Nome Preventivo", estimate.name],
    ["Descrizione", estimate.description || 'N/A'],
    ["Data creazione", estimate.createdAt?.toLocaleDateString?.('it-IT') ?? ""],
    ["Numero stratigrafie", stratigraphies.length],
    ["Superficie totale [m²]", totalArea],
    ["Totale (€)", totalCost],
    ["Data esportazione", new Date().toLocaleString('it-IT')]
  ];

  // Dettaglio stratigrafie
  const stratRows = [
    ["Nome", "Descrizione", "Superficie (m²)", "Quantità", "Totale (€)", "Tipo", "Spessore (mm)", "Certificata"],
    ...stratigraphies.map(s => [
      s.name,
      (s.description || s.stratigraphy?.description || ''),
      (typeof s.area === "number" ? s.area.toFixed(2) : ''),
      (typeof s.quantity === "number" ? s.quantity : ''),
      (typeof s.totalCost === "number" ? s.totalCost : ''),
      s.stratigraphy?.type || '',
      s.stratigraphy?.total_thickness ? `${s.stratigraphy.total_thickness}` : '',
      s.stratigraphy?.is_certified ? "Sì" : "No"
    ])
  ];

  const wb = XLSX.utils.book_new();
  // Foglio Riassunto
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Riassunto");

  // Foglio Stratigrafie
  const wsStrats = XLSX.utils.aoa_to_sheet(stratRows);
  XLSX.utils.book_append_sheet(wb, wsStrats, "Stratigrafie");

  wsStrats["!cols"] = [
    {wch: 24}, {wch: 36}, {wch: 14}, {wch: 10}, {wch: 13}, {wch: 14}, {wch: 15}, {wch: 10}
  ];

  XLSX.writeFile(wb, `preventivo_stratigrafie_${estimate.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
};
