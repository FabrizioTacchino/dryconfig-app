
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EstimateWall, CreateEstimateWallData, UpdateEstimateWallData } from '@/types/estimate';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useEstimateWalls = (estimateId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: walls = [], isLoading, error } = useQuery({
    queryKey: ['estimate-walls', estimateId],
    queryFn: async () => {
      if (!user || !estimateId) return [];
      
      const { data, error } = await supabase
        .from('estimate_walls')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching estimate walls:', error);
        throw error;
      }

      return data.map(wall => ({
        id: wall.id,
        estimateId: wall.estimate_id,
        name: wall.name,
        wallType: wall.wall_type,
        stratigraphyId: wall.stratigraphy_id,
        area: wall.area,
        pricePerSqm: wall.price_per_sqm,
        materialCost: wall.material_cost,
        laborCost: wall.labor_cost,
        accessoriesCost: wall.accessories_cost,
        totalCost: wall.total_cost,
        notes: wall.notes,
        createdAt: new Date(wall.created_at),
        updatedAt: new Date(wall.updated_at),
      })) as EstimateWall[];
    },
    enabled: !!user && !!estimateId,
  });

  const createWallMutation = useMutation({
    mutationFn: async (wallData: CreateEstimateWallData & { estimateId: string }) => {
      if (!user) throw new Error('User not authenticated');

      const totalCost = wallData.materialCost + wallData.laborCost + wallData.accessoriesCost;

      const { data, error } = await supabase
        .from('estimate_walls')
        .insert({
          estimate_id: wallData.estimateId,
          name: wallData.name,
          wall_type: wallData.wallType,
          stratigraphy_id: wallData.stratigraphyId,
          area: wallData.area,
          price_per_sqm: wallData.pricePerSqm,
          material_cost: wallData.materialCost,
          labor_cost: wallData.laborCost,
          accessories_cost: wallData.accessoriesCost,
          total_cost: totalCost,
          notes: wallData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating wall:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-walls'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Parete aggiunta con successo!');
    },
    onError: (error) => {
      console.error('Error creating wall:', error);
      toast.error('Errore nella creazione della parete');
    },
  });

  const updateWallMutation = useMutation({
    mutationFn: async (wallData: UpdateEstimateWallData) => {
      if (!user) throw new Error('User not authenticated');

      const updateData: any = { ...wallData };
      delete updateData.id;

      // Calcola il nuovo totale se sono stati modificati i costi
      if (updateData.materialCost !== undefined || updateData.laborCost !== undefined || updateData.accessoriesCost !== undefined) {
        const currentWall = walls.find(w => w.id === wallData.id);
        if (currentWall) {
          const materialCost = updateData.materialCost ?? currentWall.materialCost;
          const laborCost = updateData.laborCost ?? currentWall.laborCost;
          const accessoriesCost = updateData.accessoriesCost ?? currentWall.accessoriesCost;
          updateData.total_cost = materialCost + laborCost + accessoriesCost;
        }
      }

      const { data, error } = await supabase
        .from('estimate_walls')
        .update(updateData)
        .eq('id', wallData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating wall:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-walls'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Parete aggiornata con successo!');
    },
    onError: (error) => {
      console.error('Error updating wall:', error);
      toast.error('Errore nell\'aggiornamento della parete');
    },
  });

  const deleteWallMutation = useMutation({
    mutationFn: async (wallId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('estimate_walls')
        .delete()
        .eq('id', wallId);

      if (error) {
        console.error('Error deleting wall:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-walls'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Parete eliminata con successo!');
    },
    onError: (error) => {
      console.error('Error deleting wall:', error);
      toast.error('Errore nell\'eliminazione della parete');
    },
  });

  const totalCost = walls.reduce((sum, wall) => sum + wall.totalCost, 0);

  return {
    walls,
    isLoading,
    error,
    totalCost,
    createWall: createWallMutation.mutate,
    updateWall: updateWallMutation.mutate,
    deleteWall: deleteWallMutation.mutate,
    isCreating: createWallMutation.isPending,
    isUpdating: updateWallMutation.isPending,
    isDeleting: deleteWallMutation.isPending,
  };
};
