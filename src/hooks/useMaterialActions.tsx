
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) {
        throw new Error(`Error deleting material: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};
