import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { ScrewPreference } from '@/components/configurator-v2/hooks/screwRecommendation';

/**
 * Carica le preferenze viti per l'organization corrente.
 * Le preferenze sovrascrivono i `preferred_codes` di sistema in
 * `screw_length_rules` e sono consultate dal modulo `screwRecommendation`.
 */
export function useScrewPreferences() {
  const { currentOrganizationId } = useCurrentOrganization();

  const { data: preferences = [], isLoading } = useQuery<ScrewPreference[]>({
    queryKey: ['screw-preferences', currentOrganizationId],
    enabled: !!currentOrganizationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('screw_preferences' as never)
        .select('id, organization_id, length_rule_id, preferred_material_id, priority')
        .eq('organization_id', currentOrganizationId);
      if (error) {
        console.error('[useScrewPreferences] fetch error:', error);
        return [];
      }
      return (data ?? []) as unknown as ScrewPreference[];
    },
  });

  return { preferences, isLoading };
}

interface UpsertScrewPreferenceInput {
  length_rule_id: string;
  preferred_material_id: string | null;
  priority?: number;
}

/**
 * Upsert preferenza vite. Idempotente su (organization_id, length_rule_id, priority).
 */
export function useUpsertScrewPreference() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ length_rule_id, preferred_material_id, priority = 1 }: UpsertScrewPreferenceInput) => {
      if (!currentOrganizationId) throw new Error('Nessuna organization corrente');
      const { error } = await supabase
        .from('screw_preferences' as never)
        .upsert(
          {
            organization_id: currentOrganizationId,
            length_rule_id,
            preferred_material_id,
            priority,
          },
          { onConflict: 'organization_id,length_rule_id,priority' },
        );
      if (error) throw error;
      return { length_rule_id, preferred_material_id, priority };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screw-preferences', currentOrganizationId] });
      toast.success('Preferenza vite aggiornata');
    },
    onError: (err: Error) => {
      toast.error(`Errore: ${err.message}`);
    },
  });
}

/**
 * Elimina una preferenza vite per length_rule_id (+ priority opzionale).
 * Se priority è undefined, elimina tutte le preferenze per quella regola.
 */
export function useDeleteScrewPreference() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ length_rule_id, priority }: { length_rule_id: string; priority?: number }) => {
      if (!currentOrganizationId) throw new Error('Nessuna organization corrente');
      let q = supabase
        .from('screw_preferences' as never)
        .delete()
        .eq('organization_id', currentOrganizationId)
        .eq('length_rule_id', length_rule_id);
      if (priority !== undefined) q = q.eq('priority', priority);
      const { error } = await q;
      if (error) throw error;
      return { length_rule_id, priority };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screw-preferences', currentOrganizationId] });
      toast.success('Preferenza rimossa');
    },
    onError: (err: Error) => {
      toast.error(`Errore: ${err.message}`);
    },
  });
}
