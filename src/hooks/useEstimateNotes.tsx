
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Estimate } from "@/types";
import { toast } from "@/hooks/use-toast";

export const useEstimateNotes = (estimateId?: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newNotes: string) => {
      if (!estimateId) throw new Error("Estimate ID non fornito");
      const { error } = await supabase
        .from("estimates")
        .update({ notes: newNotes, updated_at: new Date().toISOString() })
        .eq("id", estimateId)
        .single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate"] });
      toast({ title: "Note aggiornate!" });
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({ title: "Errore nel salvataggio note", variant: "destructive" });
    }
  });

  return {
    saveNotes: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
};
