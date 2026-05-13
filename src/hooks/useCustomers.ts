import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type CustomerType = 'individual' | 'company';

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  type: CustomerType;
  vat_number: string | null;
  fiscal_code: string | null;
  address_line: string | null;
  city: string | null;
  zip_code: string | null;
  province: string | null;
  country_code: string | null;
  phone: string | null;
  email: string | null;
  pec: string | null;
  sdi_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Omit<Customer,
  'id' | 'organization_id' | 'created_at' | 'updated_at'
>;

export function useCustomers() {
  const { currentOrganizationId } = useCurrentOrganization();
  return useQuery<Customer[]>({
    queryKey: ['customers', currentOrganizationId],
    enabled: !!currentOrganizationId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!currentOrganizationId) return [];
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('customers' as any)
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('name');
      if (error) {
        console.error('[useCustomers] error:', error);
        return [];
      }
      return (data as unknown as Customer[]) ?? [];
    },
  });
}

export function useCustomer(customerId: string | null | undefined) {
  return useQuery<Customer | null>({
    queryKey: ['customer', customerId],
    enabled: !!customerId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!customerId) return null;
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('customers' as any)
        .select('*')
        .eq('id', customerId)
        .maybeSingle();
      if (error) return null;
      return (data as unknown as Customer) ?? null;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (input: Partial<CustomerInput> & { name: string }) => {
      if (!currentOrganizationId) throw new Error('Nessuna organizzazione attiva');
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('customers' as any)
        .insert({
          organization_id: currentOrganizationId,
          name: input.name,
          type: input.type ?? 'individual',
          vat_number: input.vat_number || null,
          fiscal_code: input.fiscal_code || null,
          address_line: input.address_line || null,
          city: input.city || null,
          zip_code: input.zip_code || null,
          province: input.province || null,
          country_code: input.country_code || 'IT',
          phone: input.phone || null,
          email: input.email || null,
          pec: input.pec || null,
          sdi_code: input.sdi_code || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', currentOrganizationId] });
      toast.success('Cliente creato');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CustomerInput> & { id: string }) => {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(patch)) {
        cleaned[k] = v === '' ? null : v;
      }
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('customers' as any)
        .update(cleaned)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['customers', currentOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['customer', vars.id] });
      toast.success('Cliente aggiornato');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('customers' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', currentOrganizationId] });
      toast.success('Cliente eliminato');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}
