import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type FinishCode = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface FinishLevelComponent {
  id: string;
  finish_level_id: string;
  material_id: string;
  quantity_per_sqm: number;
  notes: string | null;
  // Joined material (popolato dalla view/query)
  material?: {
    id: string;
    name: string;
    code: string | null;
    unit: string | null;
    unit_price: number | null;
    supplier: string | null;
    category: string | null;
    box_pieces: number | null;
  } | null;
}

export interface FinishLevel {
  id: string;
  organization_id: string;
  code: FinishCode;
  name: string;
  description: string | null;
  labor_minutes_per_sqm: number;
  components: FinishLevelComponent[];
}

/**
 * Fetch livelli di finitura Q1-Q4 dell'organization corrente con componenti
 * BOM e materiali joined. Usato sia da Settings UI sia dal calcolo costo
 * preventivo (F7.7).
 */
export function useFinishLevels() {
  const { currentOrganizationId } = useCurrentOrganization();
  return useQuery<FinishLevel[]>({
    queryKey: ['finish-levels', currentOrganizationId],
    enabled: !!currentOrganizationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!currentOrganizationId) return [];
      const { data: levels, error: levelsError } = await supabase
        .from('finish_levels')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('code');
      if (levelsError) {
        console.error('[useFinishLevels] levels error:', levelsError);
        return [];
      }
      if (!levels || levels.length === 0) return [];

      const { data: components, error: compsError } = await supabase
        .from('finish_level_components')
        .select(`
          *,
          material:materials!finish_level_components_material_id_fkey (
            id, name, code, unit, unit_price, supplier, category, box_pieces
          )
        `)
        .in('finish_level_id', levels.map(l => l.id));
      if (compsError) {
        console.error('[useFinishLevels] components error:', compsError);
      }

      const byLevel = new Map<string, FinishLevelComponent[]>();
      for (const c of (components ?? []) as FinishLevelComponent[]) {
        const arr = byLevel.get(c.finish_level_id) ?? [];
        arr.push(c);
        byLevel.set(c.finish_level_id, arr);
      }

      return levels.map(l => ({
        ...(l as FinishLevel),
        components: byLevel.get(l.id) ?? [],
      }));
    },
  });
}

export function useUpdateFinishLevelLabor() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async ({ id, labor_minutes_per_sqm }: { id: string; labor_minutes_per_sqm: number }) => {
      const { error } = await supabase
        .from('finish_levels')
        .update({ labor_minutes_per_sqm })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finish-levels', currentOrganizationId] });
      toast.success('Tempo posa aggiornato');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}

export function useAddFinishComponent() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async ({
      finish_level_id,
      material_id,
      quantity_per_sqm,
      notes,
    }: {
      finish_level_id: string;
      material_id: string;
      quantity_per_sqm: number;
      notes?: string | null;
    }) => {
      const { error } = await supabase
        .from('finish_level_components')
        .insert({ finish_level_id, material_id, quantity_per_sqm, notes: notes ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finish-levels', currentOrganizationId] });
      toast.success('Componente aggiunto');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}

export function useUpdateFinishComponent() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async ({
      id,
      quantity_per_sqm,
      notes,
    }: {
      id: string;
      quantity_per_sqm?: number;
      notes?: string | null;
    }) => {
      const patch: Record<string, unknown> = {};
      if (quantity_per_sqm !== undefined) patch.quantity_per_sqm = quantity_per_sqm;
      if (notes !== undefined) patch.notes = notes;
      const { error } = await supabase
        .from('finish_level_components')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finish-levels', currentOrganizationId] });
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}

export function useDeleteFinishComponent() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finish_level_components')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finish-levels', currentOrganizationId] });
      toast.success('Componente rimosso');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}

/**
 * Calcola il costo totale €/m² di un livello finitura sommando i componenti
 * (qty × prezzo unitario) + manodopera (min × hourly_rate / 60).
 *
 * Per le viti (categoria='screw') applica la stessa logica box_pieces.
 */
export function computeFinishLevelCost(
  level: FinishLevel,
  hourlyRate: number,
): { materialsCost: number; laborCost: number; totalCost: number } {
  let materialsCost = 0;
  for (const comp of level.components) {
    const mat = comp.material;
    if (!mat) continue;
    const unitPrice = Number(mat.unit_price ?? 0);
    const qty = Number(comp.quantity_per_sqm ?? 0);
    // Se vendita a scatola, dividi prezzo per box_pieces
    const unit = String(mat.unit ?? '').toLowerCase().trim();
    const box = Number(mat.box_pieces ?? 0);
    const pricePerUsageUnit = (unit === 'scatola' && box > 0)
      ? unitPrice / box
      : unitPrice;
    materialsCost += qty * pricePerUsageUnit;
  }
  const laborCost = (Number(level.labor_minutes_per_sqm) * hourlyRate) / 60;
  return {
    materialsCost,
    laborCost,
    totalCost: Math.round((materialsCost + laborCost) * 100) / 100,
  };
}
