
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Estimate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useEstimate = (estimateId: string) => {
  const { user } = useAuth();

  const { data: estimate, isLoading, error } = useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: async () => {
      if (!user || !estimateId) return null;
      
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', estimateId)
        .single();

      if (error) {
        console.error('Error fetching estimate:', error);
        throw error;
      }

      // F24/F25: porta projectName + customer_id, e i nuovi campi numerazione.
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, customer_id')
        .eq('id', data.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectData) {
        throw new Error('Estimate not found or access denied');
      }

      // Customer (opzionale)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pData = projectData as any;
      let customer = null;
      if (pData?.customer_id) {
        const { data: cust } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('customers' as any)
          .select('*')
          .eq('id', pData.customer_id)
          .maybeSingle();
        customer = cust ?? null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eData = data as any;

      return {
        id: data.id,
        projectId: data.project_id,
        projectName: pData?.name ?? undefined,
        customerId: pData?.customer_id ?? null,
        customer,
        name: data.name,
        description: data.description || '',
        status: data.status as Estimate['status'],
        version: data.version,
        totalAmount: data.total_amount,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        notes: data.notes || "",
        // F25 — numerazione offerta
        offerNumber: eData?.offer_number ?? null,
        offerNumberSeq: eData?.offer_number_seq ?? null,
        offerNumberYear: eData?.offer_number_year ?? null,
        offerIssuedAt: eData?.offer_issued_at ? new Date(eData.offer_issued_at) : null,
        // F30 — workflow timeline
        sentAt: eData?.sent_at ? new Date(eData.sent_at) : null,
        wonAt: eData?.won_at ? new Date(eData.won_at) : null,
        lostAt: eData?.lost_at ? new Date(eData.lost_at) : null,
        lostReason: eData?.lost_reason ?? null,
        walls: [],
      } as unknown as Estimate;
    },
    enabled: !!user && !!estimateId,
  });

  return {
    estimate,
    isLoading,
    error,
  };
};
