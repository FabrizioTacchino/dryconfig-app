import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaterialCategory } from '@/types';

export type { MaterialCategory };

export interface DatabaseMaterial {
  id: string;
  category: MaterialCategory;
  code: string;
  name: string;
  description: string | null;
  supplier: string;
  thickness: number | null;
  width: number | null;
  length: number | null;
  weight_per_sqm: number | null;
  thermal_conductivity: number | null;
  acoustic_performance: number | null;
  fire_resistance_class: string | null;
  color_hex: string | null;
  unit_price: number;
  list_price: number | null;
  unit: string;
  installation_time_per_sqm: number | null;
  incidence_base: number | null;
  incidence_per_sqm: number | null;
  passo: number | null;
  // Nuovi campi specifici per le lastre
  material_type: string | null;
  board_typology: string | null;
  density: number | null;
  flexural_strength: string | null;
  surface_hardness: string | null;
  en_520_type: string | null;
  water_absorption: string | null;
  humidity_resistance_class: string | null;
  environmental_certification: string | null;
  recycled_content: number | null;
  voc_class: string | null;
  rei_compatible: boolean | null;
  intended_use: string[] | null;
  installation_notes: string | null;
  fire_class: string | null;
  fire_description: string | null;
  board_type: string | null;
  fire_usage_notes: string | null;
  // Nuovi campi specifici per montanti
  sheet_thickness: number | null;
  weight_per_ml: number | null;
  profile_type: string | null;
  surface_finish: string | null;
  // AGGIUNGIAMO SCONTO - ora è una stringa per supportare sconti multipli
  discount: string | null;
  // -- NUOVI CAMPI per categoria Altro --
  is_variable_thickness?: boolean | null;
  mechanical_performance?: string | null;
  thermal_performance_notes?: string | null;
  sustainability_notes?: string | null;
  system_compatibility?: string | null;
  fire_performance_notes?: string | null;
  carbon_footprint?: string | null;
  epd?: string | null;
  vapor_permeability?: string | null;
  thermal_capacity?: string | null;
  /** Aggiungiamo box_pieces qui per viti */
  box_pieces: number | null;
  /** Aggiungiamo compatible_board_types per viti */
  compatible_board_types: string[] | null;
  /** Percentuale sfrido */
  waste_percentage: number | null;
  /** Percentuale discarica */
  disposal_percentage: number | null;
}

export const useMaterials = () => {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          list_price,
          sheet_thickness,
          weight_per_ml,
          profile_type,
          surface_finish,
          passo,
          discount,
          is_variable_thickness,
          mechanical_performance,
          thermal_performance_notes,
          sustainability_notes,
          system_compatibility,
          fire_performance_notes,
          carbon_footprint,
          epd,
          vapor_permeability,
          thermal_capacity,
          waste_percentage,
          disposal_percentage
        `)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Error fetching materials: ${error.message}`);
      }
      return data as DatabaseMaterial[];
    },
  });
};

export const useMaterialsByCategory = (category: MaterialCategory) => {
  return useQuery({
    queryKey: ['materials', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          list_price,
          sheet_thickness,
          weight_per_ml,
          profile_type,
          surface_finish,
          passo,
          discount,
          is_variable_thickness,
          mechanical_performance,
          thermal_performance_notes,
          sustainability_notes,
          system_compatibility,
          fire_performance_notes,
          carbon_footprint,
          epd,
          vapor_permeability,
          thermal_capacity,
          waste_percentage,
          disposal_percentage
        `)
        .eq('category', category as any) // <- Fix: cast to any
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Error fetching materials for category ${category}: ${error.message}`);
      }
      return data as DatabaseMaterial[];
    },
  });
};
