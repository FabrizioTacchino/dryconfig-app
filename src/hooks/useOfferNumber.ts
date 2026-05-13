import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OfferNumberInfo {
  offer_number: string;
  offer_number_seq: number;
  offer_number_year: number;
}

/**
 * Genera (o restituisce, idempotente) il numero progressivo di offerta per
 * un preventivo. Chiamare PRIMA della generazione PDF cosi` il numero finisce
 * sia in DB sia nel documento.
 *
 * Lato server e` una funzione SECURITY DEFINER che usa SELECT FOR UPDATE
 * sulla `estimate_number_sequences` per garantire atomicita`. Niente race
 * condition possibili anche con piu` utenti che premono "Stampa" insieme.
 */
export function useGenerateOfferNumber() {
  const queryClient = useQueryClient();
  return useMutation<OfferNumberInfo, Error, string>({
    mutationFn: async (estimateId: string) => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .rpc('generate_offer_number' as any, { p_estimate_id: estimateId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || !row.offer_number) {
        throw new Error('Risposta vuota dal server');
      }
      return row as OfferNumberInfo;
    },
    onSuccess: (_data, estimateId) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
    onError: (err: Error) => {
      console.error('[useGenerateOfferNumber]', err);
      toast.error(`Errore numerazione: ${err.message}`);
    },
  });
}
