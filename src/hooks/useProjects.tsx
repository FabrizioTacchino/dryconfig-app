
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateProjectData {
  name: string;
  client: string;
  description?: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      return data.map(project => ({
        id: project.id,
        name: project.name,
        client: project.client,
        description: project.description || '',
        status: project.status as Project['status'],
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      })) as Project[];
    },
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          client: projectData.client,
          description: projectData.description,
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Progetto creato con successo!');
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error('Errore nella creazione del progetto');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .update({
          name: updates.name,
          client: updates.client,
          description: updates.description,
          status: updates.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Progetto aggiornato con successo!');
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error('Errore nell\'aggiornamento del progetto');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Progetto eliminato con successo!');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error('Errore nell\'eliminazione del progetto');
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  };
};
