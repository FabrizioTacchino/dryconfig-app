
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateEstimateStratigraphyData, EstimateStratigraphy } from '@/types/estimateStratigraphy';

// Utility per convertire camelCase a snake_case
function camelToSnake(str: string) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertKeysToSnakeCase(obj: any) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[camelToSnake(key)] = value;
    return acc;
  }, {} as any);
}

export const useUpdateEstimateStratigraphy = (estimateStratigraphies: EstimateStratigraphy[]) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateEstimateStratigraphyMutation = useMutation({
    mutationFn: async (
      data: {
        id: string,
        layersData?: any,
        stratigraphyData?: any,
        unitCost?: number,
        totalCost?: number,
        pricesUpdatedAt?: string,
        name?: string,
        area?: number,
        description?: string
      } & Partial<CreateEstimateStratigraphyData>
    ) => {
      if (!user) throw new Error('User not authenticated');

      // PROTEZIONE: Verifica lo stato del preventivo prima di procedere
      const currentItem = estimateStratigraphies.find(item => item.id === data.id);
      if (!currentItem) {
        throw new Error('Stratigrafia del preventivo non trovata');
      }

      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('status, project_id')
        .eq('id', currentItem.estimateId)
        .single();

      if (estimateError) {
        console.error('Error fetching estimate for validation:', estimateError);
        throw new Error('Preventivo non trovato');
      }

      // F30: blocca se il preventivo è chiuso (vinto/perso/legacy contracted).
      if (estimateData.status === 'won' || estimateData.status === 'lost' || estimateData.status === 'contracted') {
        const label = estimateData.status === 'lost' ? 'perso' : 'vinto';
        throw new Error(`Impossibile modificare: preventivo ${label}`);
      }

      // Verifica che il progetto appartenga all'utente
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', estimateData.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !projectData) {
        throw new Error('Accesso negato al progetto');
      }

      const { id, layersData, stratigraphyData, unitCost, totalCost, pricesUpdatedAt, ...otherUpdateData } = data;

      // Base: allowed fields as before + new fields
      const allowedFields = [
        'name',
        'area',
        'unitCost',
        'description',
        'layersData',
        'stratigraphyData',
        'unitCost',
        'totalCost',
        'pricesUpdatedAt',
        // F32 Step 3: editing altezza parete post-add. Cambia il numero di
        // pezzi reali nel riepilogo materiali (useMaterialsSummary) ma NON
        // tocca unit_cost €/m² del preventivo (la "linea rossa").
        'wallHeight',
      ];
      let sanitizedData: any = {};
      for (const k of allowedFields) {
        if (data[k] !== undefined) sanitizedData[k] = data[k];
      }

      // Conversione camelCase → snake_case chiavi
      let dbUpdateData: any = convertKeysToSnakeCase(sanitizedData);

      // Serializzo layers_data / stratigraphy_data se oggetti o array
      if ('layers_data' in dbUpdateData && dbUpdateData.layers_data !== undefined) {
        dbUpdateData.layers_data = dbUpdateData.layers_data; // JSONB in supabase accetta oggetti e array direttamente in client
      }
      if ('stratigraphy_data' in dbUpdateData && dbUpdateData.stratigraphy_data !== undefined) {
        dbUpdateData.stratigraphy_data = dbUpdateData.stratigraphy_data;
      }

      // Aggiorna i costi se passati, o se area/unit_cost cambiati
      if ('area' in dbUpdateData || 'unit_cost' in dbUpdateData) {
        // usa estimateStratigraphies o partial
        const area = dbUpdateData.area ?? currentItem.area;
        const unitCost = dbUpdateData.unit_cost ?? currentItem.unitCost;
        dbUpdateData.total_cost = area * unitCost;
      }
      if ('total_cost' in dbUpdateData && dbUpdateData.total_cost === undefined) {
        delete dbUpdateData.total_cost;
      }

      if (pricesUpdatedAt) {
        dbUpdateData.prices_updated_at = pricesUpdatedAt;
      }

      // Esegui mutation
      const { data: result, error } = await supabase
        .from('estimate_stratigraphies')
        .update(dbUpdateData)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error updating estimate stratigraphy snapshot:', error, dbUpdateData);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
      toast.success('Stratigrafia del preventivo aggiornata!');
    },
    onError: (error) => {
      console.error('Error updating estimate stratigraphy snapshot:', error);
      if (error.message.includes('contrattualizzato')) {
        toast.error('Impossibile modificare: preventivo contrattualizzato');
      } else {
        toast.error('Errore nell\'aggiornamento della stratigrafia del preventivo');
      }
    },
  });

  return {
    updateEstimateStratigraphy: (
      id: string,
      data: {
        layersData?: any,
        stratigraphyData?: any,
        unitCost?: number,
        totalCost?: number,
        pricesUpdatedAt?: string,
        name?: string,
        area?: number,
        description?: string
      } & Partial<CreateEstimateStratigraphyData>
    ) => {
      updateEstimateStratigraphyMutation.mutate({ id, ...data });
    },
    isUpdating: updateEstimateStratigraphyMutation.isPending,
  };
};
