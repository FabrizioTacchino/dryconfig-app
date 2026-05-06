import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Estimate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useDuplicateEstimate } from "./useDuplicateEstimate";

export type CreateEstimateData = {
  name: string;
  description?: string;
  projectId: string;
};

export const useEstimates = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: estimates = [], isLoading, error } = useQuery({
    queryKey: ['estimates', projectId || 'all'],
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

      // Se projectId è specificato, filtra per quel progetto
      if (projectId) {
        // Prima verifichiamo che il progetto appartenga all'utente
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (projectError || !projectData) {
          console.error('Project not found or access denied:', projectError);
          return [];
        }

        query = query.eq('project_id', projectId);
      } else {
        // Altrimenti, ottieni tutti gli estimates dei progetti dell'utente
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id);

        if (userProjects && userProjects.length > 0) {
          const projectIds = userProjects.map(p => p.id);
          query = query.in('project_id', projectIds);
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

      // Verifichiamo che il progetto appartenga all'utente prima di creare l'estimate
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.projectId)
        .eq('user_id', user.id)
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

      // Verifichiamo che l'estimate appartenga all'utente prima di eliminarlo
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select(`
          id,
          project_id
        `)
        .eq('id', estimateId)
        .single();

      if (estimateError || !estimateData) {
        throw new Error('Estimate not found');
      }

      // Verifichiamo che il progetto appartenga all'utente
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectData) {
        throw new Error('Access denied');
      }

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

      console.log('Updating estimate status:', { estimateId, status });

      // Verifichiamo che l'estimate appartenga all'utente prima di aggiornarlo
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select(`
          id,
          project_id
        `)
        .eq('id', estimateId)
        .single();

      if (estimateError || !estimateData) {
        console.error('Estimate not found:', estimateError);
        throw new Error('Estimate not found');
      }

      // Verifichiamo che il progetto appartenga all'utente
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectData) {
        console.error('Project access denied:', projectError);
        throw new Error('Access denied');
      }

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
