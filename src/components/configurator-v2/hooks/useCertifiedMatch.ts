import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import type { LayerV2 } from '../types';
import {
  fingerprintComposition,
  compareCompositions,
  type LayerFingerprint,
} from './compositionFingerprint';

/**
 * Soglia minima di score per considerare un match "proponibile" all'utente.
 * Sotto questa soglia il banner non viene mostrato.
 */
const MIN_MATCH_SCORE = 0.8;
/**
 * Numero minimo di layer perché abbia senso cercare match. Sotto questa
 * soglia ogni stratigrafia da 1-2 strati matcherebbe troppe certificate.
 */
const MIN_LAYERS_FOR_MATCH = 3;

interface CertifiedRow {
  id: string;
  name: string;
  is_certified: boolean | null;
  certification_lab: string | null;
  certification_code: string | null;
  acoustic_performance: number | null;
  fire_resistance_class: string | null;
  total_thickness: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: any[];
}

export interface CertifiedMatch {
  id: string;
  name: string;
  certificationLab: string | null;
  certificationCode: string | null;
  acousticRw: number | null;
  fireResistanceClass: string | null;
  totalThicknessMm: number | null;
  score: number;
}

interface UseCertifiedMatchResult {
  match: CertifiedMatch | null;
  /** Numero totale di certificate caricate (per debug / log). */
  candidateCount: number;
  isLoading: boolean;
}

/**
 * Cerca fra le stratigrafie certificate dell'organization corrente quella
 * con composizione più simile a `layers`. Ritorna la top-1 sopra soglia
 * `MIN_MATCH_SCORE`, oppure null.
 *
 * Sospende se:
 *  - L'utente sta già costruendo una certificata (non vogliamo
 *    suggerirgli di sostituirla con se stessa o con un'altra).
 *  - Composizione troppo corta (< MIN_LAYERS_FOR_MATCH layer validi).
 *  - L'utente sta editando una stratigrafia esistente con `currentId`:
 *    la escludiamo dalle candidate (eviterebbe self-match).
 */
export function useCertifiedMatch(
  layers: LayerV2[],
  isCurrentCertified: boolean,
  currentId: string | null,
): UseCertifiedMatchResult {
  const { currentOrganizationId } = useCurrentOrganization();

  const { data: certifiedList = [], isLoading } = useQuery<CertifiedRow[]>({
    queryKey: ['certified-stratigraphies', currentOrganizationId],
    enabled: !!currentOrganizationId && !isCurrentCertified,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stratigraphies')
        .select(`
          id,
          name,
          is_certified,
          certification_lab,
          certification_code,
          acoustic_performance,
          fire_resistance_class,
          total_thickness,
          layers (
            position,
            thickness,
            materials!layers_material_id_fkey (
              category,
              width
            )
          )
        `)
        .eq('is_certified', true)
        .eq('organization_id', currentOrganizationId);
      if (error) {
        console.error('[useCertifiedMatch] query error:', error);
        return [];
      }
      return (data ?? []) as CertifiedRow[];
    },
  });

  const result = useMemo<UseCertifiedMatchResult>(() => {
    if (isCurrentCertified) {
      return { match: null, candidateCount: 0, isLoading: false };
    }
    const currentFp = fingerprintComposition(layers);
    if (currentFp.length < MIN_LAYERS_FOR_MATCH) {
      return { match: null, candidateCount: certifiedList.length, isLoading };
    }

    let best: CertifiedMatch | null = null;
    for (const cert of certifiedList) {
      if (cert.id === currentId) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const certLayers = (cert.layers ?? []).slice().sort((a: any, b: any) => a.position - b.position);
      const certFp: LayerFingerprint[] = fingerprintComposition(certLayers);
      const cmp = compareCompositions(currentFp, certFp);
      if (cmp.score >= MIN_MATCH_SCORE && (!best || cmp.score > best.score)) {
        best = {
          id: cert.id,
          name: cert.name,
          certificationLab: cert.certification_lab,
          certificationCode: cert.certification_code,
          acousticRw: cert.acoustic_performance,
          fireResistanceClass: cert.fire_resistance_class,
          totalThicknessMm: cert.total_thickness,
          score: cmp.score,
        };
      }
    }
    return { match: best, candidateCount: certifiedList.length, isLoading };
  }, [layers, certifiedList, isCurrentCertified, currentId, isLoading]);

  return result;
}
