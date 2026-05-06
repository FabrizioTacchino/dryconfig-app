
import { MaterialCategory } from '@/types';

export interface MaterialFormData {
  code: string;
  name: string;
  description: string;
  category: MaterialCategory;
  supplier: string;
  thickness: string;
  width: string;
  length: string;
  weight_per_sqm: string;
  unit_price: string;
  unit: string;
  discount: string; // AGGIUNTO QUI
  thermal_conductivity: string;
  acoustic_performance: string;
  fire_resistance_class: string;
  color_hex: string;
  incidence_base: string;
  incidence_per_sqm: string;
  passo: string; // For structure frame materials
  installation_time_per_sqm: string; // AGGIUNTO: Tempo di posa in minuti per mq
  // Campi specifici per le lastre
  material_type: string;
  board_typology: string; // Nuovo campo per tipologia lastra
  density: string;
  flexural_strength: string;
  surface_hardness: string;
  en_520_type: string;
  water_absorption: string;
  humidity_resistance_class: string;
  environmental_certification: string;
  recycled_content: string;
  voc_class: string;
  rei_compatible: string;
  intended_use: string;
  installation_notes: string;
  fire_class: string;
  fire_description: string;
  board_type: string;
  fire_usage_notes: string;
  // Campi specifici per montanti
  sheet_thickness: string; // Spessore lamiera
  weight_per_ml: string; // Peso per metro lineare
  profile_type: string; // Tipo di profilo (C, U, Ω, ecc.)
  surface_finish: string; // Finitura superficiale
  list_price: string; // AGGIUNTO: prezzo di listino
  is_variable_thickness?: boolean; // true = variabile, false = fisso
  mechanical_performance?: string;
  thermal_performance_notes?: string;
  sustainability_notes?: string;
  system_compatibility?: string;
  fire_performance_notes?: string;
  carbon_footprint?: string;
  epd?: string;
  vapor_permeability?: string;
  thermal_capacity?: string;
  box_pieces?: string; // <------ AGGIUNTO QUI
  compatible_board_types?: string; // stringa comma separated in UI, array in db
  waste_percentage?: string; // <------ SFRIDO %
  disposal_percentage?: string; // <------ DISCARICA %
}

export const initialFormData: MaterialFormData = {
  code: '',
  name: '',
  description: '',
  category: 'board' as MaterialCategory,
  supplier: '',
  thickness: '',
  width: '',
  length: '',
  weight_per_sqm: '',
  unit_price: '',
  unit: 'mq',
  discount: '', // AGGIUNTO QUI
  thermal_conductivity: '',
  acoustic_performance: '',
  fire_resistance_class: '',
  color_hex: '#CCCCCC',
  incidence_base: '',
  incidence_per_sqm: '1',
  passo: '600', // Default spacing for structure frame
  installation_time_per_sqm: '', // AGGIUNTO: Default vuoto
  // Campi specifici per le lastre
  material_type: 'gesso_rivestito', // Default: Gesso Rivestito
  board_typology: 'standard', // Default: Standard
  density: '',
  flexural_strength: '',
  surface_hardness: '',
  en_520_type: '',
  water_absorption: '',
  humidity_resistance_class: '',
  environmental_certification: '',
  recycled_content: '',
  voc_class: '',
  rei_compatible: 'false',
  intended_use: '',
  installation_notes: '',
  fire_class: '',
  fire_description: '',
  board_type: '',
  fire_usage_notes: '',
  // Campi specifici per montanti
  sheet_thickness: '0.6', // Default: 0.6mm
  weight_per_ml: '',
  profile_type: 'C', // Default: C
  surface_finish: 'zincatura_z140', // Default: Zincatura Z140
  list_price: '', // AGGIUNTO
  box_pieces: '', // <---- AGGIUNTO QUI
  compatible_board_types: '', // <---- AGGIUNTO QUI
  waste_percentage: '10', // <---- SFRIDO DEFAULT 10%
  disposal_percentage: '4', // <---- DISCARICA DEFAULT 4%
};

// Funzione per ottenere i valori di default basati sulla categoria
export const getInitialFormDataForCategory = (category: MaterialCategory): Partial<MaterialFormData> => {
  switch (category) {
    case 'structure_frame':
      return {
        unit: 'ml',
        incidence_base: '1.8',
        incidence_per_sqm: '1.8',
        passo: '600',
        sheet_thickness: '0.6',
        profile_type: 'C',
        surface_finish: 'zincatura_z140',
        installation_time_per_sqm: '2', // Default: 2 minuti per metro lineare
      };
    case 'structure_guide':
      return {
        unit: 'ml',
        incidence_base: '0.7', // Default per le guide
        incidence_per_sqm: '0.7',
        passo: '600',
        sheet_thickness: '0.6',
        profile_type: 'U', // Default U per le guide
        surface_finish: 'zincatura_z140',
        installation_time_per_sqm: '1.5', // Default: 1.5 minuti per metro lineare
      };
    case 'board':
      return {
        unit: 'mq',
        incidence_per_sqm: '1',
        material_type: 'gesso_rivestito',
        board_typology: 'standard',
        installation_time_per_sqm: '8', // Default: 8 minuti per mq
      };
    case 'insulation':
      return {
        unit: 'mq',
        incidence_per_sqm: '1',
        material_type: 'lana_vetro', // Default: Lana di vetro
        board_typology: 'pannello', // Default: Pannello
        color_hex: '#F5F5DC', // Beige chiaro per isolanti
        installation_time_per_sqm: '3', // Default: 3 minuti per mq
      };
    case 'accessory':
      return {
        unit: 'pz',
        incidence_per_sqm: '1',
        installation_time_per_sqm: '0.5', // Default: 0.5 minuti per pezzo
      };
    case 'screw':
      return {
        unit: 'pz',
        incidence_per_sqm: '25', // Default: screws per square meter
        thickness: '', // Lunghezza vite in mm
        width: '',     // Opzionale: diametro, se vorrai gestirlo
        installation_time_per_sqm: '0.1', // Default: 0.1 minuti per vite
      };
    case 'other':
      return {
        unit: 'mq',
        incidence_per_sqm: '1',
        thickness: '',
        is_variable_thickness: false,
        color_hex: '#D3D3D3',
        mechanical_performance: '',
        thermal_performance_notes: '',
        sustainability_notes: '',
        system_compatibility: '',
        fire_performance_notes: '',
        carbon_footprint: '',
        epd: '',
        vapor_permeability: '',
        thermal_capacity: '',
        installation_time_per_sqm: '5', // Default: 5 minuti per mq
      };
    default:
      return {};
  }
};

export const categories = [
  { value: 'board', label: 'Lastre' },
  { value: 'structure_frame', label: 'Struttura - Montanti' },
  { value: 'structure_guide', label: 'Struttura - Guide' },
  { value: 'insulation', label: 'Isolanti' },
  { value: 'accessory', label: 'Accessori' },
  { value: 'screw', label: 'Viti' },    // <--- AGGIUNTO QUI
  { value: 'other', label: 'Altro' }
];

// Opzioni per il materiale delle lastre - Sistema aggiornato
export const boardMaterialOptions = [
  { value: 'gesso_rivestito', label: 'Gesso Rivestito' },
  { value: 'gesso_resistente_umidita', label: 'Gesso Resistente all\'Umidità' },
  { value: 'gesso_ignifugo', label: 'Gesso Ignifugo' },
  { value: 'gesso_alte_prestazioni', label: 'Gesso ad Alte Prestazioni' },
  { value: 'gesso_fibra_rinforzata', label: 'Gesso Fibra Rinforzata' },
  { value: 'cemento_fibroarmato', label: 'Cemento Fibroarmato' },
  { value: 'roccia_minerale', label: 'Roccia Minerale' },
  { value: 'silicato', label: 'Silicato' },
  { value: 'cemento', label: 'Cemento' }
];

// Opzioni per la tipologia delle lastre - Sistema aggiornato
export const boardTypologyOptions = [
  { 
    value: 'standard', 
    label: 'Standard',
    description: 'Lastra base per uso interno in ambienti asciutti'
  },
  { 
    value: 'idro', 
    label: 'Idro',
    description: 'Resistente all\'umidità, rivestimento idrofugo'
  },
  { 
    value: 'antivapore', 
    label: 'Antivapore',
    description: 'Barriera al vapore per controllo umidità'
  },
  { 
    value: 'ignifuga', 
    label: 'Ignifuga / Fire',
    description: 'Resistente al fuoco, additivi ritardanti, fibra vetro'
  },
  { 
    value: 'alta_densita', 
    label: 'Alta Densità / Rinforzata',
    description: 'Maggiore durezza e resistenza meccanica'
  },
  { 
    value: 'idro_fire', 
    label: 'Idro-Fire / Climatica',
    description: 'Combinazione umidità + fuoco o prestazioni climatiche'
  },
  { 
    value: 'fibrocemento', 
    label: 'Fibrocemento / Idro',
    description: 'Cemento fibroarmato resistente all\'umidità'
  },
  { 
    value: 'doppia_densita', 
    label: 'Doppia Densità / Isolamento',
    description: 'Pannelli con doppia densità per isolamento'
  },
  { 
    value: 'acustica', 
    label: 'Acustica',
    description: 'Forata o con massa potenziata per isolamento acustico'
  },
  { 
    value: 'antimuffa', 
    label: 'Antimuffa / Antibatterica',
    description: 'Trattamenti specifici (uso ospedaliero, ambienti umidi)'
  },
  { 
    value: 'speciali', 
    label: 'Speciali / Tecniche',
    description: 'Resistenza a radiazioni, RX, curve, lastre flessibili, ecc.'
  }
];


// Opzioni per tipo di profilo montanti
export const profileTypeOptions = [
  { value: 'C', label: 'C - Profilo a C' },
  { value: 'U', label: 'U - Profilo a U' },
  { value: 'Ω', label: 'Ω - Profilo Omega' },
  { value: 'L', label: 'L - Profilo ad L' },
  { value: 'Z', label: 'Z - Profilo a Z' },
  { value: 'T', label: 'T - Profilo a T' }
];

// Opzioni per finitura superficiale montanti
export const surfaceFinishOptions = [
  { value: 'zincatura_z140', label: 'Zincatura Z140' },
  { value: 'zinco_magnesio', label: 'Zinco Magnesio' }
];
