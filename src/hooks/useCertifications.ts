
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CertificationData } from '@/types/certification';

export const useCertifications = () => {
  const [certifications, setCertifications] = useState<CertificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setIsLoading(true);
      
      // Fetch certifications with their associated materials
      const { data: certificationsData, error: certError } = await supabase
        .from('certifications')
        .select('*')
        .order('name');

      if (certError) throw certError;

      // Fetch certified materials for each certification
      const certificationsWithMaterials = await Promise.all(
        (certificationsData || []).map(async (cert) => {
          const { data: materialsData, error: materialsError } = await supabase
            .from('certified_stratigraphy_materials')
            .select('*')
            .eq('certification_id', cert.id)
            .order('position_order');

          if (materialsError) {
            console.error('Error fetching materials for certification:', cert.id, materialsError);
          }

          return {
            ...cert,
            materials: materialsData || []
          };
        })
      );

      setCertifications(certificationsWithMaterials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle certificazioni');
    } finally {
      setIsLoading(false);
    }
  };

  const searchCertifications = async (filters: {
    fireResistance?: string;
    acousticReduction?: number;
    type?: string;
    searchTerm?: string;
  }) => {
    try {
      setIsLoading(true);
      let query = supabase.from('certifications').select('*');

      if (filters.fireResistance) {
        query = query.ilike('value', `%${filters.fireResistance}%`);
      }

      if (filters.acousticReduction) {
        query = query.gte('acoustic_reduction', filters.acousticReduction);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,code.ilike.%${filters.searchTerm}%,solution_number.ilike.%${filters.searchTerm}%,supplier_name.ilike.%${filters.searchTerm}%`);
      }

      const { data: certificationsData, error } = await query.order('name');

      if (error) throw error;

      // Fetch materials for filtered certifications
      const certificationsWithMaterials = await Promise.all(
        (certificationsData || []).map(async (cert) => {
          const { data: materialsData, error: materialsError } = await supabase
            .from('certified_stratigraphy_materials')
            .select('*')
            .eq('certification_id', cert.id)
            .order('position_order');

          if (materialsError) {
            console.error('Error fetching materials for certification:', cert.id, materialsError);
          }

          return {
            ...cert,
            materials: materialsData || []
          };
        })
      );

      setCertifications(certificationsWithMaterials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella ricerca');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    certifications,
    isLoading,
    error,
    fetchCertifications,
    searchCertifications,
  };
};
