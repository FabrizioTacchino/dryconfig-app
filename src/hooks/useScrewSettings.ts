
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types per Quantity settings
export type ScrewQuantitySetting = {
  id: string;
  position_in_block: number;
  quantity_per_sqm: number;
  description?: string;
};

// Types per Preference settings
export type ScrewPreferenceRule = {
  id: string;
  min_length_mm: number;
  max_length_mm: number | null;
  preferred_order: string[];
  description?: string;
};

export const useScrewSettings = () => {
  // Quantità viti per posizione
  const getScrewQuantitySettings = useCallback(async (): Promise<ScrewQuantitySetting[]> => {
    // Workaround: Supabase types do not include screw_quantity_settings yet
    const { data } = await (supabase.from("screw_quantity_settings" as any) as any)
      .select("*")
      .order("position_in_block", { ascending: true });
    // eslint-disable-next-line
    return (data ?? []) as ScrewQuantitySetting[];
  }, []);

  const upsertScrewQuantitySetting = useCallback(async (setting: Omit<ScrewQuantitySetting, "id"> & { id?: string; }) => {
    await (supabase.from("screw_quantity_settings" as any) as any)
      .upsert([setting], { onConflict: "position_in_block" });
  }, []);

  const deleteScrewQuantitySetting = useCallback(async (id: string) => {
    await (supabase.from("screw_quantity_settings" as any) as any).delete().eq("id", id);
  }, []);

  // Preferenze vite per intervallo
  const getScrewPreferenceRules = useCallback(async (): Promise<ScrewPreferenceRule[]> => {
    // Workaround: Supabase types do not include screw_preference_rules yet
    const { data } = await (supabase.from("screw_preference_rules" as any) as any)
      .select("*")
      .order("min_length_mm", { ascending: false });
    // eslint-disable-next-line
    return (data ?? []) as ScrewPreferenceRule[];
  }, []);

  const upsertScrewPreferenceRule = useCallback(async (rule: Omit<ScrewPreferenceRule, "id"> & { id?: string }) => {
    await (supabase.from("screw_preference_rules" as any) as any)
      .upsert([rule], { onConflict: "min_length_mm" });
  }, []);

  const deleteScrewPreferenceRule = useCallback(async (id: string) => {
    await (supabase.from("screw_preference_rules" as any) as any).delete().eq("id", id);
  }, []);

  return {
    getScrewQuantitySettings,
    upsertScrewQuantitySetting,
    deleteScrewQuantitySetting,
    getScrewPreferenceRules,
    upsertScrewPreferenceRule,
    deleteScrewPreferenceRule,
  };
};
