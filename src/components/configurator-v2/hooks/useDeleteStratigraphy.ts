import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteStratigraphyResult {
  id: string;
  estimateRefs: number;
  walls: number;
  wallConfigs: number;
}

/**
 * Hook V2 per eliminare una stratigrafia.
 *
 * Pre-check FK:
 *  - `walls` referenziate via FK RESTRICT → blocca delete con messaggio chiaro
 *  - `wall_configurations` referenziate → blocca delete (default RESTRICT)
 *  - `estimate_stratigraphies` referenziate via FK SET NULL → ok delete, ma
 *    lo snapshot della stratigrafia nel preventivo viene preservato
 *  - `layers` via FK CASCADE → cancellati automaticamente
 *
 * Restituisce un summary delle referenze trovate prima del delete.
 */
export function useDeleteStratigraphy() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (stratigraphyId: string): Promise<DeleteStratigraphyResult> => {
      // Pre-check FK
      const [walls, wallConfigs, estimateRefs] = await Promise.all([
        supabase.from('walls').select('id', { count: 'exact', head: true }).eq('stratigraphy_id', stratigraphyId),
        supabase.from('wall_configurations').select('id', { count: 'exact', head: true }).eq('stratigraphy_id', stratigraphyId),
        supabase.from('estimate_stratigraphies').select('id', { count: 'exact', head: true }).eq('stratigraphy_id', stratigraphyId),
      ]);

      const wallsCount = walls.count ?? 0;
      const wallConfigsCount = wallConfigs.count ?? 0;
      const estimateRefsCount = estimateRefs.count ?? 0;

      if (wallsCount > 0 || wallConfigsCount > 0) {
        const parts: string[] = [];
        if (wallsCount > 0) parts.push(`${wallsCount} pareti`);
        if (wallConfigsCount > 0) parts.push(`${wallConfigsCount} configurazioni`);
        throw new Error(
          `Stratigrafia in uso in ${parts.join(' e ')}. Rimuovi prima quei riferimenti.`,
        );
      }

      const { error } = await supabase
        .from('stratigraphies')
        .delete()
        .eq('id', stratigraphyId);
      if (error) throw error;

      return {
        id: stratigraphyId,
        estimateRefs: estimateRefsCount,
        walls: wallsCount,
        wallConfigs: wallConfigsCount,
      };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['stratigraphies'] });
      qc.invalidateQueries({ queryKey: ['unified-stratigraphies'] });
      qc.invalidateQueries({ queryKey: ['stratigraphy', result.id] });
      qc.invalidateQueries({ queryKey: ['estimate-stratigraphies'] });
      qc.invalidateQueries({ queryKey: ['certified-stratigraphies'] });
      const note = result.estimateRefs > 0
        ? ` (rimossa da ${result.estimateRefs} preventivi, gli snapshot sono preservati)`
        : '';
      toast.success(`Stratigrafia eliminata${note}.`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Errore durante l\'eliminazione.');
    },
  });

  return {
    deleteStratigraphy: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}
