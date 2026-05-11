import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type WasteCategory =
  | 'board'
  | 'structure_frame'
  | 'structure_guide'
  | 'insulation'
  | 'screw'
  | 'accessory'
  | 'finish'
  | 'ceiling_tile'
  | 'other';

export interface WasteFactor {
  id: string;
  organization_id: string;
  category: WasteCategory;
  percentage: number;
}

/** Fallback se per qualche motivo la tabella non ha record per la cat richiesta. */
const DEFAULT_WASTE_PCT: Record<WasteCategory, number> = {
  board: 3,
  structure_frame: 2,
  structure_guide: 2,
  insulation: 7,
  screw: 5,
  accessory: 5,
  finish: 10,
  ceiling_tile: 3,
  other: 0,
};

/**
 * Hook che ritorna i fattori di sfrido (% per categoria) per l'organization
 * corrente, con fallback su valori UNI standard se la tabella è vuota.
 * Si usa nel riepilogo materiali (RDA), MAI nel calcolo costo preventivo.
 */
export function useWasteFactors() {
  const { currentOrganizationId } = useCurrentOrganization();

  const { data: factors = [], isLoading } = useQuery<WasteFactor[]>({
    queryKey: ['waste-factors', currentOrganizationId],
    enabled: !!currentOrganizationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waste_factors')
        .select('*')
        .eq('organization_id', currentOrganizationId);
      if (error) {
        console.error('[useWasteFactors] fetch error:', error);
        return [];
      }
      return (data ?? []) as WasteFactor[];
    },
  });

  /** Ritorna lo sfrido % per la categoria. Fallback su DEFAULT se non configurato. */
  const getWasteFor = (category: string): number => {
    const match = factors.find(f => f.category === category);
    if (match) return Number(match.percentage) || 0;
    return DEFAULT_WASTE_PCT[category as WasteCategory] ?? 0;
  };

  /** Mappa completa categoria → %, includendo fallback. */
  const wasteMap: Record<string, number> = {};
  for (const cat of Object.keys(DEFAULT_WASTE_PCT) as WasteCategory[]) {
    wasteMap[cat] = getWasteFor(cat);
  }

  return { factors, wasteMap, getWasteFor, isLoading };
}

/**
 * Mutation per aggiornare uno sfrido. Upsert su (organization_id, category).
 */
export function useUpdateWasteFactor() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ category, percentage }: { category: WasteCategory; percentage: number }) => {
      if (!currentOrganizationId) throw new Error('Nessuna organization corrente');
      const { error } = await supabase
        .from('waste_factors')
        .upsert(
          {
            organization_id: currentOrganizationId,
            category,
            percentage,
          },
          { onConflict: 'organization_id,category' },
        );
      if (error) throw error;
      return { category, percentage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-factors', currentOrganizationId] });
      toast.success('Sfrido aggiornato');
    },
    onError: (err: Error) => {
      toast.error(`Errore: ${err.message}`);
    },
  });
}
