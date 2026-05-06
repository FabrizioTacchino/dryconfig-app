
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FireClassMapping {
  id: string;
  fire_class: string;
  description: string;
  board_type: string;
  usage_notes: string;
  created_at: string;
}

export const useFireClassMappings = () => {
  return useQuery({
    queryKey: ['fire-class-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fire_class_mappings')
        .select('*')
        .order('fire_class', { ascending: true });

      if (error) {
        throw new Error(`Error fetching fire class mappings: ${error.message}`);
      }

      return data as FireClassMapping[];
    },
  });
};
