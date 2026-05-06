
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WallType, DatabaseWallType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export interface DatabaseStratigraphy {
  id: string;
  name: string;
  description: string | null;
  type: WallType;
  is_certified: boolean;
  certification_id: string | null;
  total_thickness: number;
  weight_per_sqm: number | null;
  thermal_performance: number | null;
  acoustic_performance: number | null;
  fire_resistance_class: string | null;
  cost_per_sqm: number | null;
  installation_time_per_sqm: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  layers?: Array<{
    id: string;
    material_id: string;
    thickness: number;
    position: number;
    inter_axis?: number;
    material?: {
      id: string;
      name: string;
      color_hex: string;
      category: string;
      unit: string;
      unit_price: number;
      supplier: string;
      incidence_per_sqm?: number;
    };
  }>;
}

// Helper function to convert WallType to DatabaseWallType
const mapWallTypeToDatabase = (wallType: WallType): DatabaseWallType => {
  // If the wall type is one of the database types, use it as-is
  if (['plating', 'counterwall', 'single', 'double', 'ceiling'].includes(wallType)) {
    return wallType as DatabaseWallType;
  }
  
  // If not, map legacy types to their closest database equivalent
  switch (wallType) {
    case 'internal':
    case 'external':
      return 'single';
    case 'roof':
      return 'ceiling';
    case 'foundation':
      return 'single';
    default:
      return 'single'; // Default fallback
  }
};

export const useStratigraphies = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stratigraphies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stratigraphies')
        .select(`
          *,
          layers (
            id,
            material_id,
            thickness,
            position,
            inter_axis,
            materials (
              id,
              name,
              color_hex,
              category,
              unit,
              unit_price,
              supplier,
              incidence_per_sqm
            )
          )
        `)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Error fetching stratigraphies: ${error.message}`);
      }

      return data as DatabaseStratigraphy[];
    },
    enabled: !!user,
  });
};

export const useStratigraphiesByType = (type: WallType) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stratigraphies', type, user?.id],
    queryFn: async () => {
      // Map the wall type to a database compatible type
      const dbType = mapWallTypeToDatabase(type);
      
      const { data, error } = await supabase
        .from('stratigraphies')
        .select(`
          *,
          layers (
            id,
            material_id,
            thickness,
            position,
            inter_axis,
            materials (
              id,
              name,
              color_hex,
              category,
              unit,
              unit_price,
              supplier,
              incidence_per_sqm
            )
          )
        `)
        .eq('type', dbType)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Error fetching stratigraphies for type ${type}: ${error.message}`);
      }

      return data as DatabaseStratigraphy[];
    },
    enabled: !!user,
  });
};
