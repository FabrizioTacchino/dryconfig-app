
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateEstimateStratigraphyData } from '@/types/estimateStratigraphy';

export const useCreateEstimateStratigraphy = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createEstimateStratigraphyMutation = useMutation({
    mutationFn: async (data: CreateEstimateStratigraphyData) => {
      if (!user) throw new Error('User not authenticated');

      // PROTEZIONE: Verifica lo stato del preventivo prima di procedere
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('status, project_id')
        .eq('id', data.estimateId)
        .single();

      if (estimateError) {
        console.error('Error fetching estimate for validation:', estimateError);
        throw new Error('Preventivo non trovato');
      }

      // Blocca se il preventivo è contrattualizzato
      if (estimateData.status === 'contracted') {
        throw new Error('Impossibile aggiungere stratigrafie: preventivo contrattualizzato');
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

      // First, get the complete stratigraphy data with layers and materials (including custom_screws)
      const { data: stratigraphySnapshot, error: snapshotError } = await supabase
        .from('stratigraphies')
        .select(`
          *,
          layers (
            id,
            position,
            thickness,
            inter_axis,
            material_id,
            screw_material_id,
            screw_quantity,
            screw_cost_per_sqm,
            material_cost_per_sqm,
            installation_time_minutes,
            materials!layers_material_id_fkey (
              id,
              name,
              category,
              unit,
              unit_price,
              incidence_per_sqm,
              color_hex,
              supplier,
              code,
              description,
              weight_per_sqm,
              thermal_conductivity,
              acoustic_performance,
              fire_resistance_class,
              compatible_board_types,
              length
            ),
            screw_materials:materials!layers_screw_material_id_fkey (
              id,
              name,
              category,
              unit,
              unit_price,
              incidence_per_sqm,
              color_hex,
              supplier,
              code,
              description
            )
          )
        `)
        .eq('id', data.stratigraphyId)
        .single();

      if (snapshotError) {
        console.error('Error fetching stratigraphy snapshot:', snapshotError);
        throw snapshotError;
      }

      const totalCost = data.area * (data.quantity || 1) * data.unitCost;

      const { data: result, error } = await supabase
        .from('estimate_stratigraphies')
        .insert({
          estimate_id: data.estimateId,
          stratigraphy_id: data.stratigraphyId,
          name: data.name,
          description: data.description,
          area: data.area,
          quantity: data.quantity || 1,
          unit_cost: data.unitCost,
          total_cost: totalCost,
          // New snapshot fields including custom_screws data
          stratigraphy_data: stratigraphySnapshot,
          layers_data: stratigraphySnapshot.layers?.sort((a: any, b: any) => a.position - b.position) || [],
          prices_updated_at: new Date().toISOString(),
          is_snapshot: true,
          original_stratigraphy_id: data.stratigraphyId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating estimate stratigraphy:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-stratigraphies'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
      toast.success('Stratigrafia aggiunta al preventivo!');
    },
    onError: (error) => {
      console.error('Error creating estimate stratigraphy:', error);
      if (error.message.includes('contrattualizzato')) {
        toast.error('Impossibile aggiungere: preventivo contrattualizzato');
      } else {
        toast.error('Errore nell\'aggiunta della stratigrafia');
      }
    },
  });

  return {
    createEstimateStratigraphy: createEstimateStratigraphyMutation.mutate,
    isCreating: createEstimateStratigraphyMutation.isPending,
  };
};
