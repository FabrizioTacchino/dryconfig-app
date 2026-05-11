import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StratigraphyDeleteImpact {
  /** Numero di preventivi che usano la stratigrafia (via original_stratigraphy_id o stratigraphy_id). */
  estimateCount: number;
  /** Numero di pareti (`walls`) che la referenziano via FK RESTRICT — il delete fallirebbe. */
  wallCount: number;
  /** Numero di wall_configurations referenziate (anche queste FK RESTRICT). */
  wallConfigCount: number;
  /** True se ci sono blockers. In tal caso il delete fallirà. */
  hasBlockers: boolean;
}

/**
 * Pre-check delle referenze prima del delete: conta preventivi (snapshot vivono),
 * pareti e wall_configurations. Permette al dialog di confermare di mostrare
 * cifre concrete invece di un disclaimer generico.
 *
 * La query gira solo se `enabled` è true (tipicamente quando il dialog apre).
 */
export function useStratigraphyDeleteImpact(
  stratigraphyId: string | null,
  enabled: boolean,
) {
  return useQuery<StratigraphyDeleteImpact>({
    queryKey: ['stratigraphy-delete-impact', stratigraphyId],
    enabled: enabled && !!stratigraphyId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!stratigraphyId) {
        return { estimateCount: 0, wallCount: 0, wallConfigCount: 0, hasBlockers: false };
      }
      // OR condition non è supportato in modo elegante: facciamo 2 count separati
      // su `original_stratigraphy_id` e `stratigraphy_id` e prendiamo il max
      // (in genere puntano allo stesso row, ma uno potrebbe essere null).
      const [
        estimatesByOriginal,
        estimatesByCurrent,
        walls,
        wallConfigs,
      ] = await Promise.all([
        supabase
          .from('estimate_stratigraphies')
          .select('id', { count: 'exact', head: true })
          .eq('original_stratigraphy_id', stratigraphyId),
        supabase
          .from('estimate_stratigraphies')
          .select('id', { count: 'exact', head: true })
          .eq('stratigraphy_id', stratigraphyId),
        supabase
          .from('walls')
          .select('id', { count: 'exact', head: true })
          .eq('stratigraphy_id', stratigraphyId),
        supabase
          .from('wall_configurations')
          .select('id', { count: 'exact', head: true })
          .eq('stratigraphy_id', stratigraphyId),
      ]);
      const estimateCount = Math.max(
        estimatesByOriginal.count ?? 0,
        estimatesByCurrent.count ?? 0,
      );
      const wallCount = walls.count ?? 0;
      const wallConfigCount = wallConfigs.count ?? 0;
      return {
        estimateCount,
        wallCount,
        wallConfigCount,
        hasBlockers: wallCount > 0 || wallConfigCount > 0,
      };
    },
  });
}
