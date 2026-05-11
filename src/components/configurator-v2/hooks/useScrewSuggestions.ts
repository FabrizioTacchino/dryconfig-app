import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMaterials, type DatabaseMaterial } from '@/hooks/useMaterials';
import { useScrewPreferences } from '@/hooks/useScrewPreferences';
import type { LayerV2, StratigraphyTypology } from '../types';
import {
  computeScrewSuggestion,
  detectSupportType,
  typologyToWallType,
  type ScrewLengthRule,
  type ScrewSpacingRule,
  type ScrewSuggestion,
} from './screwRecommendation';

/**
 * Hook che restituisce un Map<layerId, ScrewSuggestion> per ogni layer board
 * della stratigrafia corrente.
 *
 * Carica una sola volta `screw_length_rules` + `screw_spacing_rules` (cached
 * 1h) e itera i layer. Le suggestion sono pure: niente side-effect.
 *
 * Per applicare effettivamente le suggestion ai layer (auto-suggest), chi
 * consuma questo hook decide quando fare update — vedere `useConfiguratorState`.
 */
export function useScrewSuggestions(
  layers: LayerV2[],
  typology: StratigraphyTypology,
): {
  suggestions: Map<string, ScrewSuggestion>;
  isLoading: boolean;
  error: string | null;
} {
  const { data: allMaterials = [] } = useMaterials();

  const { data: lengthRules = [], isLoading: l1, error: e1 } = useQuery<ScrewLengthRule[]>({
    queryKey: ['screw_length_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('screw_length_rules' as never)
        .select('*');
      if (error) throw error;
      return (data as unknown as ScrewLengthRule[]) ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: spacingRules = [], isLoading: l2, error: e2 } = useQuery<ScrewSpacingRule[]>({
    queryKey: ['screw_spacing_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('screw_spacing_rules' as never)
        .select('*');
      if (error) throw error;
      return (data as unknown as ScrewSpacingRule[]) ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { preferences: orgPreferences } = useScrewPreferences();

  const allScrews = useMemo<DatabaseMaterial[]>(
    () => allMaterials.filter(m => m.category === 'screw'),
    [allMaterials],
  );

  const suggestions = useMemo(() => {
    const map = new Map<string, ScrewSuggestion>();
    if (lengthRules.length === 0 || spacingRules.length === 0 || allScrews.length === 0) {
      return map;
    }
    const wallType = typologyToWallType(typology);
    const supportType = detectSupportType(layers);
    layers.forEach((l, idx) => {
      if (l.material?.category !== 'board') return;
      if (!l.materialId) return;
      const sug = computeScrewSuggestion({
        layers,
        layerIdx: idx,
        allScrews,
        wallType,
        supportType,
        lengthRules,
        spacingRules,
        orgPreferences,
      });
      if (sug) map.set(l.id, sug);
    });
    return map;
  }, [layers, typology, allScrews, lengthRules, spacingRules, orgPreferences]);

  return {
    suggestions,
    isLoading: l1 || l2,
    error: e1?.message ?? e2?.message ?? null,
  };
}
