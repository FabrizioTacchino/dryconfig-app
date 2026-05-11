import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import {
  fingerprintComposition,
  compareCompositions,
  type LayerFingerprint,
} from '@/components/configurator-v2/hooks/compositionFingerprint';
import { toast } from 'sonner';

export interface ReconnectCandidate {
  id: string;
  name: string;
  isCertified: boolean;
  totalThicknessMm: number | null;
  acousticRw: number | null;
  fireResistanceClass: string | null;
  /** Match score 0-1 con la composizione dello snapshot orfano. */
  score: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawLayers: any[];
}

interface CatalogRow {
  id: string;
  name: string;
  is_certified: boolean | null;
  total_thickness: number | null;
  acoustic_performance: number | null;
  fire_resistance_class: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: any[];
}

/**
 * Cerca nel catalogo dell'organization corrente le stratigrafie con
 * composizione simile allo snapshot orfano fornito. Usato dal dialog
 * "Ricollega al catalogo" per le row preventivo che hanno perso il
 * riferimento originale (es. stratigrafia eliminata dalla libreria).
 *
 * Soglia minima score: 0.6 (più permissiva di useCertifiedMatch perché
 * qui l'utente sta cercando attivamente un sostituto, non riceve un
 * suggerimento passivo). Top N = 5.
 */
const RECONNECT_MIN_SCORE = 0.6;
const RECONNECT_TOP_N = 5;

export function useReconnectCandidates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orphanLayers: any[] | null,
  enabled: boolean,
) {
  const { currentOrganizationId } = useCurrentOrganization();

  return useQuery<ReconnectCandidate[]>({
    queryKey: ['reconnect-candidates', currentOrganizationId, orphanLayers?.length ?? 0],
    enabled: enabled && !!currentOrganizationId && !!orphanLayers && orphanLayers.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stratigraphies')
        .select(`
          id,
          name,
          is_certified,
          total_thickness,
          acoustic_performance,
          fire_resistance_class,
          layers (
            position,
            thickness,
            materials!layers_material_id_fkey (
              category,
              width
            )
          )
        `)
        .eq('organization_id', currentOrganizationId);
      if (error) {
        console.error('[useReconnectCandidates] error:', error);
        return [];
      }

      const orphanFp = fingerprintComposition(orphanLayers ?? []);
      if (orphanFp.length === 0) return [];

      const candidates: ReconnectCandidate[] = [];
      for (const row of (data as CatalogRow[]) ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedLayers = (row.layers ?? []).slice().sort((a: any, b: any) => a.position - b.position);
        const candFp: LayerFingerprint[] = fingerprintComposition(sortedLayers);
        const cmp = compareCompositions(orphanFp, candFp);
        if (cmp.score >= RECONNECT_MIN_SCORE) {
          candidates.push({
            id: row.id,
            name: row.name,
            isCertified: !!row.is_certified,
            totalThicknessMm: row.total_thickness,
            acousticRw: row.acoustic_performance,
            fireResistanceClass: row.fire_resistance_class,
            score: cmp.score,
            rawLayers: sortedLayers,
          });
        }
      }
      return candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, RECONNECT_TOP_N);
    },
  });
}

interface ReconnectInput {
  estimateStratigraphyId: string;
  catalogStratigraphyId: string;
  /** Se true, aggiorna anche `stratigraphy_data` + `layers_data` con il fresh fetch (refresha snapshot). Default true. */
  refreshSnapshot?: boolean;
}

/**
 * Mutation che ri-collega una row preventivo orfana a una stratigrafia
 * del catalogo. Aggiorna `original_stratigraphy_id` + `stratigraphy_id`
 * e (se richiesto) re-snapshotta i dati composizione/prezzi da lì.
 *
 * NON tocca `unit_cost`/`total_cost` salvati: l'aggiornamento prezzi va
 * fatto poi via "Aggiorna Prezzi" (ora di nuovo disponibile sulla row).
 */
export function useReconnectStratigraphy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      estimateStratigraphyId,
      catalogStratigraphyId,
      refreshSnapshot = true,
    }: ReconnectInput) => {
      // Carica i dati freschi dal catalogo (necessario sia per il
      // re-snapshot che per validare che l'id esista ancora).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let snapshotPayload: { stratigraphy_data?: any; layers_data?: any } = {};
      if (refreshSnapshot) {
        const { data: fresh, error: freshError } = await supabase
          .from('stratigraphies')
          .select(`
            *,
            layers (
              id, position, thickness, inter_axis, material_id, screw_material_id,
              screw_quantity, screw_cost_per_sqm, material_cost_per_sqm,
              installation_time_minutes,
              materials!layers_material_id_fkey (
                id, name, color_hex, category, unit, unit_price, supplier,
                code, description, weight_per_sqm, thermal_conductivity,
                acoustic_performance, fire_resistance_class, incidence_per_sqm,
                installation_time_per_sqm, length, width
              ),
              screw_materials:materials!layers_screw_material_id_fkey (
                id, name, color_hex, category, unit, unit_price, supplier
              )
            )
          `)
          .eq('id', catalogStratigraphyId)
          .single();
        if (freshError || !fresh) {
          throw new Error('Stratigrafia di catalogo non trovata');
        }
        snapshotPayload = {
          stratigraphy_data: fresh,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layers_data: (fresh.layers ?? []).slice().sort((a: any, b: any) => a.position - b.position),
        };
      }

      const { error: updateError } = await supabase
        .from('estimate_stratigraphies')
        .update({
          stratigraphy_id: catalogStratigraphyId,
          original_stratigraphy_id: catalogStratigraphyId,
          ...snapshotPayload,
          // is_snapshot resta true: lo snapshot continua a esistere indipendentemente.
        })
        .eq('id', estimateStratigraphyId);
      if (updateError) throw updateError;

      return { estimateStratigraphyId, catalogStratigraphyId };
    },
    onSuccess: () => {
      toast.success('Stratigrafia ricollegata al catalogo');
      queryClient.invalidateQueries({ queryKey: ['estimate-stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    },
    onError: (error: Error) => {
      toast.error(`Errore ricollegamento: ${error.message}`);
    },
  });
}
