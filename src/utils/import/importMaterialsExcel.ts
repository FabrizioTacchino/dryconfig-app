import * as XLSX from 'xlsx';
import { DatabaseMaterial } from '@/hooks/useMaterials';

export interface ParsedMaterialInput {
  code: string;
  name: string;
  category: string;
  supplier: string;
  description?: string;
  thickness?: number;
  width?: number;
  length?: number;
  weight_per_sqm?: number;
  unit_price: number;
  unit: string;
  discount?: number;
  incidence_base?: number;
  incidence_per_sqm?: number;
  passo?: number;
  installation_time_per_sqm?: number;
  valid_until?: string;
  material_type?: string;
  board_typology?: string;
  density?: number;
  flexural_strength?: string;
  surface_hardness?: string;
  en_520_type?: string;
  water_absorption?: string;
  humidity_resistance_class?: string;
  thermal_conductivity?: number;
  acoustic_performance?: number;
  fire_resistance_class?: string;
  fire_class?: string;
  fire_description?: string;
  fire_usage_notes?: string;
  board_type?: string;
  rei_compatible?: boolean;
  environmental_certification?: string;
  recycled_content?: number;
  voc_class?: string;
  color_hex?: string;
  intended_use?: string[];
  installation_notes?: string;
  sheet_thickness?: number;
  weight_per_ml?: number;
  profile_type?: string;
  surface_finish?: string;
  created_at?: string;
  updated_at?: string;
}

function parseYesNo(val: any): boolean | undefined {
  if (typeof val === "string") {
    if (val.trim().toLowerCase() === "sì" || val.trim().toLowerCase() === "si") return true;
    if (val.trim().toLowerCase() === "no") return false;
  }
  if (typeof val === "boolean") return val;
  return undefined;
}
function parseArray(val: any): string[] | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(val)) return val;
  return undefined;
}

export async function parseMaterialsExcel(file: File): Promise<{materials: ParsedMaterialInput[], errors: string[]}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        const errors: string[] = [];
        const materials: ParsedMaterialInput[] = [];

        json.forEach((row, i) => {
          if (!row.Codice || !row.Nome || !row.Categoria || !row.Fornitore || !row["Prezzo unitario (€)"] || !row.Unità) {
            errors.push(`Riga ${i+2}: Campi obbligatori mancanti.`);
            return;
          }
          // Validazione sconto
          let discount = Number(row["Sconto (%)"]);
          if (isNaN(discount)) discount = 0;
          if (discount < 0 || discount > 100) {
            errors.push(`Riga ${i + 2}: Sconto fuori range (0-100%)`);
            discount = 0;
          }
          materials.push({
            code: row.Codice,
            name: row.Nome,
            category: row.Categoria,
            supplier: row.Fornitore,
            description: row.Descrizione,
            thickness: Number(row["Spessore (mm)"]) || undefined,
            width: Number(row["Larghezza (mm)"]) || undefined,
            length: Number(row["Lunghezza (mm)"]) || undefined,
            weight_per_sqm: Number(row["Peso (kg/m²)"]) || undefined,
            unit_price: Number(row["Prezzo unitario (€)"]),
            unit: row.Unità,
            discount: discount,
            incidence_base: Number(row["Incidenza Base"]) || undefined,
            incidence_per_sqm: Number(row["Incidenza (unit/m²)"]) || undefined,
            passo: Number(row["Passo (mm)"]) || undefined,
            installation_time_per_sqm: Number(row["Tempo installazione (ore/m²)"]) || undefined,
            valid_until: row["Valido fino al"],
            material_type: row["Tipo materiale"],
            board_typology: row["Tipologia lastra"],
            density: Number(row["Densità (kg/m³)"]) || undefined,
            flexural_strength: row["Resistenza a flessione"],
            surface_hardness: row["Durezza superficiale"],
            en_520_type: row["EN 520"],
            water_absorption: row["Assorbimento acqua"],
            humidity_resistance_class: row["Classe resistenza umidità"],
            thermal_conductivity: Number(row["Conduttività termica (λ)"]) || undefined,
            acoustic_performance: Number(row["Prestazione acustica (Rw)"]) || undefined,
            fire_resistance_class: row["Resistenza fuoco - classe"],
            fire_class: row["Classe fuoco"],
            fire_description: row["Descrizione fuoco"],
            fire_usage_notes: row["Note utilizzo fuoco"],
            board_type: row["Tipo lastra"],
            rei_compatible: parseYesNo(row["Compatibile REI"]),
            environmental_certification: row["Certificazione ambientale"],
            recycled_content: Number(row["Contenuto riciclato (%)"]) || undefined,
            voc_class: row["Classe VOC"],
            color_hex: row["Colore (hex)"],
            intended_use: parseArray(row["Destinazioni d'uso"]),
            installation_notes: row["Note installazione"],
            sheet_thickness: Number(row["Spessore lamiera (mm)"]) || undefined,
            weight_per_ml: Number(row["Peso per ml (kg)"]) || undefined,
            profile_type: row["Tipo profilo"],
            surface_finish: row["Finitura superficiale"],
            created_at: row["Data creazione"],
            updated_at: row["Data ultima modifica"],
          });
        });

        resolve({materials, errors});
      } catch (err) {
        resolve({materials: [], errors: ['Formato file non valido o errore durante la lettura del file.']});
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
