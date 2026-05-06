
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// --- TYPES: explicitly define the structures for upsert/insert ---
// For screw_configurations (excluding id, created_at, updated_at)
type ScrewConfigInsert = {
  plates_count: number;
  screw_length: number;
  screw_code: string;
  compatible_board_types: string[];
  margin?: number;
  notes?: string;
};

export const useConfiguratorSettings = () => {
  // ------------- BASE GENERIC KEY-VALUE -----------------
  const getSetting = useCallback(async (key: string): Promise<string | null> => {
    const { data } = await supabase
      .from("configurator_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return data?.value ?? null;
  }, []);

  const setSetting = useCallback(async (key: string, value: string): Promise<void> => {
    const { error } = await supabase.from("configurator_settings").upsert([{ key, value }], { 
      onConflict: "key",
      ignoreDuplicates: false 
    });
    if (error) {
      console.error('Error updating setting:', error);
      throw new Error(`Impossibile aggiornare l'impostazione: ${error.message}`);
    }
  }, []);

  // -------------- SCREW CONFIGURATIONS -----------------
  const getScrewConfigs = useCallback(async () => {
    const { data } = await supabase.from("screw_configurations").select("*");
    return data ?? [];
  }, []);

  const addScrewConfig = useCallback(async (config: ScrewConfigInsert) => {
    await supabase.from("screw_configurations").insert([config]);
  }, []);

  const removeScrewConfig = useCallback(async (id: string) => {
    await supabase.from("screw_configurations").delete().eq("id", id);
  }, []);

  return {
    getSetting,
    setSetting,
    getScrewConfigs,
    addScrewConfig,
    removeScrewConfig,
  };
};
