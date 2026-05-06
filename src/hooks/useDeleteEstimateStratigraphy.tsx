
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useDeleteEstimateStratigraphy = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteEstimateStratigraphyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      // PROTEZIONE: Verifica lo stato del preventivo prima di procedere
      const { data: estimateStratigraphyData, error: fetchError } = await supabase
        .from('estimate_stratigraphies')
        .select('estimate_id')
        .eq('id', id)
        .single();

      if (fetchError || !estimateStratigraphyData) {
        throw new Error('Stratigrafia del preventivo non trovata');
      }

      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('status, project_id')
        .eq('id', estimateStratigraphyData.estimate_id)
        .single();

      if (estimateError) {
        console.error('Error fetching estimate for validation:', estimateError);
        throw new Error('Preventivo non trovato');
      }

      // Blocca se il preventivo è contrattualizzato
      if (estimateData.status === 'contracted') {
        throw new Error('Impossibile eliminare: preventivo contrattualizzato');
      }

      // Verifica che il progetto appartenga all'utente
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectData) {
        throw new Error('Accesso negato al progetto');
      }

      const { error } = await supabase
        .from('estimate_stratigraphies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting estimate stratigraphy:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
      toast.success('Stratigrafia rimossa dal preventivo!');
    },
    onError: (error) => {
      console.error('Error deleting estimate stratigraphy:', error);
      if (error.message.includes('contrattualizzato')) {
        toast.error('Impossibile eliminare: preventivo contrattualizzato');
      } else {
        toast.error('Errore nella rimozione della stratigrafia');
      }
    },
  });

  return {
    deleteEstimateStratigraphy: deleteEstimateStratigraphyMutation.mutate,
    isDeleting: deleteEstimateStratigraphyMutation.isPending,
  };
};
