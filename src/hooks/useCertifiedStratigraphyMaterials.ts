
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CertifiedStratigraphyMaterial } from '@/types/certification';

export const useCertifiedStratigraphyMaterials = (certificationId?: string) => {
  const [materials, setMaterials] = useState<CertifiedStratigraphyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (certificationId) {
      fetchMaterials();
    }
  }, [certificationId]);

  const fetchMaterials = async () => {
    if (!certificationId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('certified_stratigraphy_materials')
        .select('*')
        .eq('certification_id', certificationId)
        .order('position_type');

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei materiali');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMaterials = async (newMaterials: Omit<CertifiedStratigraphyMaterial, 'id' | 'created_at'>[]) => {
    try {
      // Prima elimina i materiali esistenti
      if (certificationId) {
        await supabase
          .from('certified_stratigraphy_materials')
          .delete()
          .eq('certification_id', certificationId);
      }

      // Poi inserisce i nuovi materiali
      const { error } = await supabase
        .from('certified_stratigraphy_materials')
        .insert(newMaterials);

      if (error) throw error;
      await fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio dei materiali');
      throw err;
    }
  };

  return {
    materials,
    isLoading,
    error,
    fetchMaterials,
    saveMaterials,
  };
};
