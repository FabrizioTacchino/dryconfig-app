import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Estimate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useDuplicateEstimate } from "./useDuplicateEstimate";

export type CreateEstimateData = {
  name: string;
  description?: string;
  projectId: string;
};

export const useEstimates = (projectId?: string) => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  const { data: estimates = [], isLoading, error } = useQuery({
    queryKey: ['estimates', projectId || 'all', currentOrganizationId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('estimates')
        .select(`
          *,
          projects!estimates_project_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (currentOrganizationId) {
        query = query.eq('organization_id', currentOrganizationId);
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (!currentOrganizationId) {
        // Fallback per utenti senza organization (caso edge): filtra via projects dell'utente
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id);
        if (userProjects && userProjects.length > 0) {
          query = query.in('project_id', userProjects.map(p => p.id));
        } else {
          return [];
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching estimates:', error);
        throw error;
      }

      return data.map(estimate => ({
        id: estimate.id,
        projectId: estimate.project_id,
        name: estimate.name,
        description: estimate.description || '',
        status: estimate.status as Estimate['status'],
        version: estimate.version,
        totalAmount: estimate.total_amount,
        createdAt: new Date(estimate.created_at),
        updatedAt: new Date(estimate.updated_at),
        walls: [], // TODO: Load walls when needed
        projectName: estimate.projects?.name || '',
      })) as Estimate[];
    },
    enabled: !!user,
  });

  const createEstimateMutation = useMutation({
    mutationFn: async (estimateData: CreateEstimateData) => {
      if (!user) throw new Error('User not authenticated');

      // RLS org-based protegge: verifichiamo solo l'esistenza del progetto, non l'ownership user_id
      // (ogni membro dell'org può creare preventivi sui progetti dell'org).
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.projectId)
        .single();

      if (projectError || !projectData) {
        throw new Error('Project not found or access denied');
      }

      const { data, error } = await supabase
        .from('estimates')
        .insert({
          name: estimateData.name,
          description: estimateData.description,
          project_id: estimateData.projectId,
          status: 'draft',
          version: 1,
          total_amount: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating estimate:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Preventivo creato con successo!');
    },
    onError: (error) => {
      console.error('Error creating estimate:', error);
      toast.error('Errore nella creazione del preventivo');
    },
  });

  const deleteEstimateMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      if (!user) throw new Error('User not authenticated');

      // RLS org-based protegge: ogni membro dell'org può eliminare i preventivi dell'org.
      const { error } = await supabase
        .from('estimates')
        .delete()
        .eq('id', estimateId);

      if (error) {
        console.error('Error deleting estimate:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Preventivo eliminato con successo!');
    },
    onError: (error) => {
      console.error('Error deleting estimate:', error);
      toast.error('Errore nell\'eliminazione del preventivo');
    },
  });

  const updateEstimateStatusMutation = useMutation({
    mutationFn: async ({ estimateId, status }: { estimateId: string; status: Estimate['status'] }) => {
      if (!user) throw new Error('User not authenticated');

      // RLS org-based protegge: ogni membro dell'org può aggiornare i preventivi dell'org.
      const { data, error } = await supabase
        .from('estimates')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', estimateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating estimate status:', error);
        throw error;
      }

      console.log('Estimate status updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate tutte le query degli estimates per aggiornare l'interfaccia
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Stato del preventivo aggiornato!');
      console.log('Status update successful, queries invalidated');
    },
    onError: (error) => {
      console.error('Error updating estimate status:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    },
  });

  // Hook per duplicazione (rende la fn disponibile)
  const { duplicateEstimate, isDuplicating } = useDuplicateEstimate();

  return {
    estimates,
    isLoading,
    error,
    createEstimate: createEstimateMutation.mutate,
    deleteEstimate: deleteEstimateMutation.mutate,
    updateEstimateStatus: (estimateId: string, status: Estimate['status']) => {
      console.log('Hook updateEstimateStatus called with:', { estimateId, status });
      updateEstimateStatusMutation.mutate({ estimateId, status });
    },
    isCreating: createEstimateMutation.isPending,
    isDeleting: deleteEstimateMutation.isPending,
    isUpdatingStatus: updateEstimateStatusMutation.isPending,
    duplicateEstimate,
    isDuplicating,
  };
};
