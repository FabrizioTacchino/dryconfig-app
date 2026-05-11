import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LayerV2 } from '../types';
import { computeStratigraphyCosts, type CostBreakdown } from './computeStratigraphyCosts';

/**
 * Hook: calcola breakdown costi al m² per la stratigrafia corrente.
 *
 * Legge `cost_per_hour` da `configurator_settings` (cached). Se la lettura
 * fallisce o non esiste, usa fallback €30/h.
 */
export function useStratigraphyCosts(
  layers: LayerV2[],
  studSpacingMm: 300 | 400 | 600,
): { breakdown: CostBreakdown; costPerHour: number; isLoading: boolean } {
  const { data: costPerHour = 30, isLoading } = useQuery({
    queryKey: ['cost_per_hour'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configurator_settings')
        .select('value')
        .eq('key', 'cost_per_hour')
        .maybeSingle();
      if (error) {
        console.warn('[useStratigraphyCosts] cost_per_hour fetch error:', error.message);
        return 30;
      }
      const parsed = parseFloat(data?.value ?? '30');
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });

  const breakdown = useMemo(
    () => computeStratigraphyCosts(layers, studSpacingMm, costPerHour),
    [layers, studSpacingMm, costPerHour],
  );

  return { breakdown, costPerHour, isLoading };
}
