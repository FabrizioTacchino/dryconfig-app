
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { CreateEstimateData } from "./useEstimates";
import { EstimateStratigraphy } from "@/types/estimateStratigraphy";

/**
 * Duplica un intero preventivo (estimate) assieme alle sue stratigrafie (copia snapshot, non referenza!)
 * Opzionalmente consente di assegnare un nome personalizzato.
 */
export const useDuplicateEstimate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      estimate,
      estimateStratigraphies,
      newName,
    }: {
      estimate: any;
      estimateStratigraphies: EstimateStratigraphy[];
      newName?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // 1. Crea nuovo estimate (bozza) con nome incrementale/nome selezionato:
      const name = newName || `${estimate.name} (Copia)`;
      const { data: createdEstimate, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          name,
          description: estimate.description,
          project_id: estimate.projectId,
          status: "draft",
          version: estimate.version + 1,
          total_amount: 0,
        })
        .select()
        .single();

      if (estimateError || !createdEstimate) {
        throw estimateError || new Error("Errore nella duplicazione preventivo");
      }

      // 2. Recupera tutte le stratigrafie collegate (snapshot)
      // 3. Per ciascuna, crea una nuova estimate_stratigraphy snapshot collegata al nuovo estimate
      for (const strat of estimateStratigraphies) {
        const { error: stratError } = await supabase
          .from("estimate_stratigraphies")
          .insert({
            estimate_id: createdEstimate.id,
            stratigraphy_id: null,
            name: strat.name,
            description: strat.description,
            area: strat.area,
            quantity: strat.quantity,
            unit_cost: strat.unitCost,
            total_cost: strat.totalCost,
            stratigraphy_data: strat.stratigraphyData || null,
            layers_data: strat.layersData || null,
            prices_updated_at: strat.pricesUpdatedAt
              ? new Date(strat.pricesUpdatedAt).toISOString()
              : new Date().toISOString(),
            is_snapshot: true,
            original_stratigraphy_id: strat.stratigraphyId || null,
            finish_level: (strat as any).finishLevel ?? undefined,
            wall_height: (strat as any).wallHeight ?? undefined,
            calculated_materials: (strat as any).calculatedMaterials ?? undefined,
          });

        if (stratError) {
          throw stratError;
        }
      }

      return createdEstimate;
    },
    onSuccess: (createdEstimate) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Preventivo duplicato con successo!");
    },
    onError: (error) => {
      toast.error(
        "Si è verificato un errore durante la duplicazione del preventivo"
      );
      console.error("[useDuplicateEstimate] error:", error);
    },
  });

  return {
    duplicateEstimate: mutation.mutate,
    isDuplicating: mutation.isPending,
  };
};
