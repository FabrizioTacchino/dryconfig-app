
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';
import { WallType, DatabaseWallType } from '@/types';

// Helper function to convert WallType to DatabaseWallType
const mapWallTypeToDatabase = (wallType: WallType | string): DatabaseWallType => {
  // If the wall type is one of the database types, use it as-is
  if (['plating', 'counterwall', 'single', 'double', 'ceiling'].includes(wallType)) {
    return wallType as DatabaseWallType;
  }
  
  // If not, map legacy types to their closest database equivalent
  switch (wallType) {
    case 'internal':
    case 'external':
      return 'single';
    case 'roof':
      return 'ceiling';
    case 'foundation':
      return 'single';
    default:
      return 'single'; // Default fallback
  }
};

export const useStratigraphyDuplicateHandler = () => {
  const handleDuplicate = async (
    stratigraphy: UnifiedStratigraphy,
    onDuplicate?: (stratigraphy: UnifiedStratigraphy) => void
  ) => {
    if (onDuplicate) {
      onDuplicate(stratigraphy);
      return { success: true };
    }

    try {
      if (stratigraphy.is_certified) {
        // Per stratigrafie certificate, duplica la stratigrafia con un nuovo nome
        const { data: newStratigraphy, error } = await supabase
          .from('stratigraphies')
          .insert({
            name: `${stratigraphy.name} (Copia)`,
            description: stratigraphy.description || 'Copia di stratigrafia certificata',
            type: mapWallTypeToDatabase(stratigraphy.type),
            total_thickness: stratigraphy.total_thickness,
            is_certified: false, // Le copie non sono certificate
            weight_per_sqm: stratigraphy.weight_per_sqm,
            thermal_performance: stratigraphy.thermal_performance,
            cost_per_sqm: stratigraphy.cost_per_sqm,
            installation_time_per_sqm: stratigraphy.installation_time_per_sqm,
            acoustic_performance: stratigraphy.acoustic_performance,
            fire_resistance_class: stratigraphy.fire_resistance_class,
            certification_id: null // Le copie non hanno certification_id
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Stratigrafia duplicata con successo');
        
        // Ricarica la pagina per mostrare la nuova stratigrafia
        window.location.reload();
      } else {
        // Per stratigrafie normali, duplica sia la stratigrafia che i layer
        const { data: newStratigraphy, error: stratigraphyError } = await supabase
          .from('stratigraphies')
          .insert({
            name: `${stratigraphy.name} (Copia)`,
            description: stratigraphy.description || 'Copia di stratigrafia personalizzata',
            type: mapWallTypeToDatabase(stratigraphy.type),
            total_thickness: stratigraphy.total_thickness,
            is_certified: false,
            weight_per_sqm: stratigraphy.weight_per_sqm,
            thermal_performance: stratigraphy.thermal_performance,
            cost_per_sqm: stratigraphy.cost_per_sqm,
            installation_time_per_sqm: stratigraphy.installation_time_per_sqm,
            acoustic_performance: stratigraphy.acoustic_performance,
            fire_resistance_class: stratigraphy.fire_resistance_class,
            certification_id: stratigraphy.certification_id // Mantieni il certification_id se presente
          })
          .select()
          .single();

        if (stratigraphyError) throw stratigraphyError;

        // Duplica i layer se esistono
        if (stratigraphy.layers && stratigraphy.layers.length > 0) {
          const { error: layersError } = await supabase
            .from('layers')
            .insert(
              stratigraphy.layers.map((layer: any) => ({
                stratigraphy_id: newStratigraphy.id,
                material_id: layer.material_id,
                position: layer.position,
                thickness: layer.thickness,
                inter_axis: layer.inter_axis
              }))
            );

          if (layersError) throw layersError;
        }

        toast.success('Stratigrafia duplicata con successo');
        
        // Ricarica la pagina per mostrare la nuova stratigraphy
        window.location.reload();
      }

      return { success: true };
    } catch (error) {
      console.error('Errore nella duplicazione:', error);
      toast.error('Errore nella duplicazione della stratigrafia');
      return { success: false, error };
    }
  };

  return { handleDuplicate };
};
