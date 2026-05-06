import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';

export const useStratigraphyDeleteHandler = () => {
  const handleDelete = async (
    stratigraphy: UnifiedStratigraphy,
    onDelete?: (stratigraphy: UnifiedStratigraphy) => void
  ) => {
    if (onDelete) {
      onDelete(stratigraphy);
      toast.success('Stratigrafia eliminata con successo');
      return { success: true };
    }

    try {
      console.log('Deleting stratigraphy:', stratigraphy);

      if (stratigraphy.is_certified && stratigraphy.certification_id) {
        // Per stratigrafie certificate, verifica prima se la certificazione esiste
        const { data: certExists } = await supabase
          .from('certifications')
          .select('id')
          .eq('id', stratigraphy.certification_id)
          .maybeSingle();

        console.log('Certification exists:', certExists);

        // Elimina sempre i materiali certificati se esistono
        const { error: materialsError } = await supabase
          .from('certified_stratigraphy_materials')
          .delete()
          .eq('certification_id', stratigraphy.certification_id);

        if (materialsError) {
          console.error('Error deleting certified materials:', materialsError);
          // Non fermare l'eliminazione se i materiali non esistono
        }

        // Elimina la stratigrafia
        const { error: stratigraphyError } = await supabase
          .from('stratigraphies')
          .delete()
          .eq('id', stratigraphy.id);

        if (stratigraphyError) {
          console.error('Error deleting stratigraphy:', stratigraphyError);
          throw stratigraphyError;
        }

        // Elimina la certificazione solo se esiste
        if (certExists) {
          const { error: certError } = await supabase
            .from('certifications')
            .delete()
            .eq('id', stratigraphy.certification_id);

          if (certError) {
            console.error('Error deleting certification:', certError);
            // Non fermare l'eliminazione se la certificazione non esiste più
            console.log('Certification might have been already deleted, continuing...');
          }
        } else {
          console.log('Certification does not exist, skipping deletion');
        }
      } else {
        // Per stratigrafie normali, elimina prima i layer associati
        const { error: layersError } = await supabase
          .from('layers')
          .delete()
          .eq('stratigraphy_id', stratigraphy.id);

        if (layersError) {
          console.error('Error deleting layers:', layersError);
          // Non fermare l'eliminazione se i layer non esistono
        }

        // Poi elimina la stratigrafia
        const { error: stratigraphyError } = await supabase
          .from('stratigraphies')
          .delete()
          .eq('id', stratigraphy.id);

        if (stratigraphyError) {
          // NUOVA: Mostra l'errore esatto al toast
          console.error('Error deleting stratigraphy:', stratigraphyError);
          toast.error(`Errore nell'eliminazione: ${stratigraphyError.message || stratigraphyError.details || "Stratigrafia non eliminabile. Assicurati che non sia usata in altri oggetti."}`);
          return { success: false, error: stratigraphyError };
        }
      }

      toast.success('Stratigrafia eliminata con successo');
      
      // Ricarica la pagina per aggiornare la lista
      window.location.reload();

      return { success: true };
    } catch (error: any) {
      console.error('Errore nell\'eliminazione:', error);
      toast.error(`Errore inatteso durante l'eliminazione: ${error.message || error.toString()}`);
      return { success: false, error };
    }
  };

  return { handleDelete };
};
