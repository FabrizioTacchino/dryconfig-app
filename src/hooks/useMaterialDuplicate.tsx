
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseMaterial } from '@/hooks/useMaterials';

export const useMaterialDuplicate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (material: DatabaseMaterial) => {
      // Crea una copia del materiale escludendo l'ID e aggiungendo "(Copia)" al nome
      const duplicatedMaterial = {
        ...material,
        name: `${material.name} (Copia)`,
        code: `${material.code}_COPY_${Date.now()}`, // Aggiungi timestamp per evitare duplicati
      };

      // Remove the ID from duplicate
      delete (duplicatedMaterial as any).id;

      const { data, error } = await supabase
        .from('materials')
        .insert([duplicatedMaterial as any]); // Allow 'screw' category

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Materiale duplicato con successo!');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: Error) => {
      console.error('Error duplicating material:', error);
      toast.error('Errore durante la duplicazione del materiale');
    },
  });
};
