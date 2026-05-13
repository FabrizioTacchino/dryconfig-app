import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Estimate, LostReason } from '@/types';
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
    mutationFn: async ({
      estimateId,
      status,
      lostReason,
    }: {
      estimateId: string;
      status: Estimate['status'];
      lostReason?: LostReason | null;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // F30 — timeline workflow: scriviamo i timestamp solo all'ingresso del rispettivo
      // stato. Tornare a draft pulisce won/lost ma NON sent_at (audit: il preventivo era
      // già stato comunicato al cliente). lost_reason si resetta solo quando esci da lost.
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = {
        status,
        updated_at: now,
      };
      if (status === 'sent') patch.sent_at = now;
      if (status === 'won') patch.won_at = now;
      if (status === 'lost') {
        patch.lost_at = now;
        patch.lost_reason = lostReason ?? null;
      }
      if (status === 'draft') {
        patch.won_at = null;
        patch.lost_at = null;
        patch.lost_reason = null;
      }

      // RLS org-based protegge: ogni membro dell'org può aggiornare i preventivi dell'org.
      const { data, error } = await supabase
        .from('estimates')
        .update(patch)
        .eq('id', estimateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating estimate status:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', vars.estimateId] });
      const labels: Record<Estimate['status'], string> = {
        draft: 'Preventivo riportato in bozza',
        sent: 'Preventivo marcato come inviato',
        won: 'Preventivo vinto! Lavoro confermato 🎉',
        lost: 'Preventivo segnato come perso',
        pending: 'Stato aggiornato',
        approved: 'Stato aggiornato',
        contracted: 'Stato aggiornato',
      };
      toast.success(labels[vars.status] ?? 'Stato aggiornato');
    },
    onError: (error) => {
      console.error('Error updating estimate status:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    },
  });

  /**
   * F30 bonus: aggiorna SOLO il `lost_reason` su un preventivo già in stato
   * lost, SENZA toccare lost_at o gli altri timestamp. Serve a correggere
   * il motivo registrato a posteriori (es. l'utente ha scoperto in seguito
   * che il vero motivo era "Prezzo" e non "Altro").
   */
  const updateLostReasonMutation = useMutation({
    mutationFn: async ({ estimateId, lostReason }: { estimateId: string; lostReason: LostReason | null }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('estimates')
        .update({ lost_reason: lostReason, updated_at: new Date().toISOString() })
        .eq('id', estimateId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', vars.estimateId] });
      toast.success('Motivo perdita aggiornato');
    },
    onError: (error) => {
      console.error('Error updating lost reason:', error);
      toast.error("Errore nell'aggiornamento del motivo");
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
    updateEstimateStatus: (
      estimateId: string,
      status: Estimate['status'],
      lostReason?: LostReason | null,
    ) => {
      updateEstimateStatusMutation.mutate({ estimateId, status, lostReason });
    },
    /**
     * F30 bonus: aggiorna solo il motivo perdita di un preventivo già in lost.
     * Non altera timestamps. Per il flusso normale "transizione a lost" usa
     * updateEstimateStatus(id, 'lost', motivo).
     */
    updateLostReason: (estimateId: string, lostReason: LostReason | null) => {
      updateLostReasonMutation.mutate({ estimateId, lostReason });
    },
    isCreating: createEstimateMutation.isPending,
    isDeleting: deleteEstimateMutation.isPending,
    isUpdatingStatus: updateEstimateStatusMutation.isPending,
    isUpdatingLostReason: updateLostReasonMutation.isPending,
    duplicateEstimate,
    isDuplicating,
  };
};
