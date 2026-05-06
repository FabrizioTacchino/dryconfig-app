
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useProject = (projectId: string) => {
  const { user } = useAuth();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!user || !projectId) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        client: data.client,
        description: data.description || '',
        status: data.status as Project['status'],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as Project;
    },
    enabled: !!user && !!projectId,
  });

  return {
    project,
    isLoading,
    error,
  };
};
