
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MaterialCoefficient {
  id: string;
  material_category: string;
  finish_level: string;
  coefficient_type: string;
  coefficient_value: number;
  unit: string;
}

export const useMaterialCoefficients = () => {
  const { data: materialCoefficients = [], isLoading } = useQuery({
    queryKey: ['material-coefficients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_coefficients')
        .select('*')
        .order('material_category', { ascending: true });

      if (error) {
        console.error('Error fetching material coefficients:', error);
        throw error;
      }

      return data.map(item => ({
        id: item.id,
        material_category: item.material_category,
        finish_level: item.finish_level,
        coefficient_type: item.coefficient_type,
        coefficient_value: Number(item.coefficient_value),
        unit: item.unit,
      })) as MaterialCoefficient[];
    },
  });

  return {
    materialCoefficients,
    isLoading,
  };
};
