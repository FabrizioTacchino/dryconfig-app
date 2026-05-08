import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaterialCategory } from '@/types';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';

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
  /** Sconto extra del singolo prodotto (%), applicato dopo la catena famiglia */
  extra_discount: number | null;
  // ---- Pricing dalla view materials_with_pricing (sola lettura) ----
  /** Catena cumulativa di sconti famiglia (es. [50, 54.5]) */
  family_discount_chain?: number[] | null;
  /** % netta della sola catena famiglia (es. 77.10 = paghi 22.90%) */
  family_discount_pct?: number | null;
  /** % extra del prodotto (uguale a extra_discount) */
  extra_discount_pct?: number | null;
  /** % totale combinata famiglia + extra */
  total_discount_pct?: number | null;
  /** Prezzo netto live (list × catena famiglia × (1 - extra/100)) */
  net_price?: number | null;
  /** True se la famiglia ha uno sconto attivo per questa org */
  has_family_discount?: boolean;
  /** True se il prodotto ha uno sconto extra > 0 */
  has_extra_discount?: boolean;
}

export const useMaterials = () => {
  const { currentOrganizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ['materials', currentOrganizationId ?? 'global-only'],
    queryFn: async () => {
      // Visibile: catalogo globale (organization_id IS NULL) + materiali della org corrente
      let query = supabase
        .from('materials_with_pricing' as never)
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (currentOrganizationId) {
        query = query.or(`organization_id.is.null,organization_id.eq.${currentOrganizationId}`);
      } else {
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;
      if (error) throw new Error(`Error fetching materials: ${error.message}`);
      return data as DatabaseMaterial[];
    },
  });
};

export const useMaterialsByCategory = (category: MaterialCategory) => {
  const { currentOrganizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ['materials', category, currentOrganizationId ?? 'global-only'],
    queryFn: async () => {
      let query = supabase
        .from('materials_with_pricing' as never)
        .select('*')
        .eq('is_active', true)
        .eq('category', category as any)
        .order('name', { ascending: true });

      if (currentOrganizationId) {
        query = query.or(`organization_id.is.null,organization_id.eq.${currentOrganizationId}`);
      } else {
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;
      if (error) throw new Error(`Error fetching materials for category ${category}: ${error.message}`);
      return data as DatabaseMaterial[];
    },
  });
};
