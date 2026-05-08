import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface SupplierRow {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  default_discount: string | null;
  notes: string | null;
  is_active: boolean;
  country_code: string;
  created_at: string;
  // computed
  is_global: boolean;
  families_count: number;
  materials_count: number;
  discounts_count: number;
}

export interface FamilyRow {
  id: string;
  supplier_id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  sort_order: number;
  is_active: boolean;
  // computed for current org
  materials_count: number;
  discount_id: string | null;
  discounts: number[];
  discount_valid_until: string | null;
}

// =====================================================================
// Suppliers list with computed counts
// =====================================================================
export const useSuppliersList = () => {
  const { currentOrganizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ['suppliers-list', currentOrganizationId],
    enabled: !!currentOrganizationId,
    queryFn: async (): Promise<SupplierRow[]> => {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('organization_id', { ascending: false, nullsFirst: false })
        .order('name');
      if (error) throw error;

      // Get counts in batches
      const ids = (suppliers ?? []).map(s => s.id);
      if (ids.length === 0) return [];

      const [{ data: famsCount }, { data: matsCount }, { data: discCount }] = await Promise.all([
        supabase.from('supplier_product_families').select('supplier_id').in('supplier_id', ids),
        supabase.from('materials').select('supplier_id').in('supplier_id', ids).eq('is_active', true),
        supabase.from('customer_discounts').select('supplier_id').in('supplier_id', ids).eq('organization_id', currentOrganizationId!),
      ]);

      const countBy = (arr: any[] | null, key: string) => {
        const m = new Map<string, number>();
        (arr ?? []).forEach(r => m.set(r[key], (m.get(r[key]) ?? 0) + 1));
        return m;
      };
      const fc = countBy(famsCount, 'supplier_id');
      const mc = countBy(matsCount, 'supplier_id');
      const dc = countBy(discCount, 'supplier_id');

      return (suppliers ?? []).map((s: any) => ({
        ...s,
        is_global: s.organization_id === null,
        families_count: fc.get(s.id) ?? 0,
        materials_count: mc.get(s.id) ?? 0,
        discounts_count: dc.get(s.id) ?? 0,
      })) as SupplierRow[];
    },
  });
};

// =====================================================================
// Families of a supplier with materials count and current org discounts
// =====================================================================
export const useSupplierFamilies = (supplierId: string | null) => {
  const { currentOrganizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ['supplier-families', supplierId, currentOrganizationId],
    enabled: !!supplierId && !!currentOrganizationId,
    queryFn: async (): Promise<FamilyRow[]> => {
      const [{ data: fams, error: fErr }, { data: mats }, { data: discs }] = await Promise.all([
        supabase
          .from('supplier_product_families')
          .select('*')
          .eq('supplier_id', supplierId!)
          .order('sort_order'),
        supabase
          .from('materials')
          .select('id, family_id')
          .eq('supplier_id', supplierId!)
          .eq('is_active', true),
        supabase
          .from('customer_discounts')
          .select('*')
          .eq('supplier_id', supplierId!)
          .eq('organization_id', currentOrganizationId!),
      ]);
      if (fErr) throw fErr;

      const matsByFamily = new Map<string, number>();
      (mats ?? []).forEach(m => {
        if (m.family_id) matsByFamily.set(m.family_id, (matsByFamily.get(m.family_id) ?? 0) + 1);
      });
      const discByFamily = new Map<string, any>();
      (discs ?? []).forEach(d => { if (d.family_id) discByFamily.set(d.family_id, d); });

      return (fams ?? []).map((f: any) => ({
        ...f,
        materials_count: matsByFamily.get(f.id) ?? 0,
        discount_id: discByFamily.get(f.id)?.id ?? null,
        discounts: (discByFamily.get(f.id)?.discounts ?? []) as number[],
        discount_valid_until: discByFamily.get(f.id)?.valid_until ?? null,
      })) as FamilyRow[];
    },
  });
};

// =====================================================================
// Supplier mutations
// =====================================================================
interface CreateSupplierInput {
  name: string;
  slug?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  default_discount?: string;
  notes?: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const useCreateOrgSupplier = () => {
  const { currentOrganizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSupplierInput) => {
      if (!currentOrganizationId) throw new Error('Nessuna organizzazione attiva');
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          organization_id: currentOrganizationId,
          name: input.name.trim(),
          slug: (input.slug || slugify(input.name)).slice(0, 60),
          website: input.website?.trim() || null,
          contact_email: input.contact_email?.trim() || null,
          contact_phone: input.contact_phone?.trim() || null,
          default_discount: input.default_discount?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      toast.success('Fornitore creato');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<CreateSupplierInput> & { is_active?: boolean }) => {
      const { error } = await supabase.from('suppliers').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      toast.success('Fornitore aggiornato');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};

// =====================================================================
// Customer discount upsert / delete (set/clear discount for a family)
// =====================================================================
interface UpsertDiscountInput {
  supplier_id: string;
  family_id: string;
  discounts: number[];
  valid_until?: string | null;
  notes?: string | null;
}

export const useUpsertDiscount = () => {
  const { currentOrganizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertDiscountInput) => {
      if (!currentOrganizationId) throw new Error('Nessuna organizzazione attiva');
      const cleaned = input.discounts.filter(d => Number.isFinite(d) && d > 0 && d < 100);
      const { error } = await supabase
        .from('customer_discounts')
        .upsert(
          {
            organization_id: currentOrganizationId,
            supplier_id: input.supplier_id,
            family_id: input.family_id,
            discounts: cleaned,
            valid_until: input.valid_until ?? null,
            notes: input.notes ?? null,
          },
          { onConflict: 'organization_id,supplier_id,family_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-families', vars.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Sconto aggiornato');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};

export const useDeleteDiscount = () => {
  const { currentOrganizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (discountId: string) => {
      const { error } = await supabase.from('customer_discounts').delete().eq('id', discountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-families'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Sconto rimosso');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};
