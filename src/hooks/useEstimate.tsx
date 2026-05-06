
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Estimate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useEstimate = (estimateId: string) => {
  const { user } = useAuth();

  const { data: estimate, isLoading, error } = useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: async () => {
      if (!user || !estimateId) return null;
      
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', estimateId)
        .single();

      if (error) {
        console.error('Error fetching estimate:', error);
        throw error;
      }

      // Verifichiamo che il progetto appartenga all'utente
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', data.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectData) {
        throw new Error('Estimate not found or access denied');
      }

      return {
        id: data.id,
        projectId: data.project_id,
        name: data.name,
        description: data.description || '',
        status: data.status as Estimate['status'],
        version: data.version,
        totalAmount: data.total_amount,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        notes: data.notes || "", // <-- AGGIUNGIAMO QUI
        walls: [], // Verrà caricato separatamente
      } as Estimate;
    },
    enabled: !!user && !!estimateId,
  });

  return {
    estimate,
    isLoading,
    error,
  };
};
