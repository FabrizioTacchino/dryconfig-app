import * as XLSX from 'xlsx';
import { DatabaseMaterial } from '@/hooks/useMaterials';

// Helper per formattazione boolean/array/string
function boolToYesNo(value: boolean | null | undefined) {
  return value === true ? "Sì" : value === false ? "No" : "";
}
function arrToList(value: string[] | null | undefined) {
  return Array.isArray(value) ? value.join(", ") : "";
}

export function exportMaterialsToExcel(materials: DatabaseMaterial[]) {
  const worksheetData = materials.map((m) => ({
    Codice: m.code,
    Nome: m.name,
    Categoria: m.category,
    Fornitore: m.supplier,
    Descrizione: m.description ?? "",
    "Spessore (mm)": m.thickness ?? "",
    "Larghezza (mm)": m.width ?? "",
    "Lunghezza (mm)": m.length ?? "",
    "Peso (kg/m²)": m.weight_per_sqm ?? "",
    "Prezzo unitario (€)": m.unit_price ?? "",
    "Unità": m.unit,
    "Sconto (%)": m.discount ?? "",
    "Incidenza Base": m.incidence_base ?? "",
    "Incidenza (unit/m²)": m.incidence_per_sqm ?? "",
    "Passo (mm)": m.passo ?? "",
    "Tempo installazione (ore/m²)": m.installation_time_per_sqm ?? "",
    "Tipo materiale": m.material_type ?? "",
    "Tipologia lastra": m.board_typology ?? "",
    "Densità (kg/m³)": m.density ?? "",
    "Resistenza a flessione": m.flexural_strength ?? "",
    "Durezza superficiale": m.surface_hardness ?? "",
    "EN 520": m.en_520_type ?? "",
    "Assorbimento acqua": m.water_absorption ?? "",
    "Classe resistenza umidità": m.humidity_resistance_class ?? "",
    "Conduttività termica (λ)": m.thermal_conductivity ?? "",
    "Prestazione acustica (Rw)": m.acoustic_performance ?? "",
    "Resistenza fuoco - classe": m.fire_resistance_class ?? "",
    "Classe fuoco": m.fire_class ?? "",
    "Descrizione fuoco": m.fire_description ?? "",
    "Note utilizzo fuoco": m.fire_usage_notes ?? "",
    "Tipo lastra": m.board_type ?? "",
    "Compatibile REI": boolToYesNo(m.rei_compatible),
    "Certificazione ambientale": m.environmental_certification ?? "",
    "Contenuto riciclato (%)": m.recycled_content ?? "",
    "Classe VOC": m.voc_class ?? "",
    "Colore (hex)": m.color_hex ?? "",
    "Destinazioni d'uso": arrToList(m.intended_use),
    "Note installazione": m.installation_notes ?? "",
    "Spessore lamiera (mm)": m.sheet_thickness ?? "",
    "Peso per ml (kg)": m.weight_per_ml ?? "",
    "Tipo profilo": m.profile_type ?? "",
    "Finitura superficiale": m.surface_finish ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materiali completi');
  XLSX.writeFile(workbook, 'listino_materiali_completo.xlsx');
}
