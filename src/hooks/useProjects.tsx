
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CreateProjectData {
  name: string;
  client: string;
  description?: string;
  /** F28: FK al cliente in anagrafica (opzionale per retro-compat). */
  customer_id?: string | null;
}

export const useProjects = () => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', user?.id, currentOrganizationId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentOrganizationId) {
        query = query.eq('organization_id', currentOrganizationId);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

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

      const insertPayload: Record<string, unknown> = {
        name: projectData.name,
        client: projectData.client,
        description: projectData.description,
        user_id: user.id,
        organization_id: currentOrganizationId ?? undefined,
        status: 'active',
      };
      if (projectData.customer_id !== undefined) {
        insertPayload.customer_id = projectData.customer_id;
      }
      const { data, error } = await supabase
        .from('projects')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertPayload as any)
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

      // RLS org-based protegge: ogni membro dell'org può aggiornare i progetti dell'org.
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

      // RLS org-based: solo owner/admin dell'org possono eliminare. Il client non filtra
      // ulteriormente per user_id (era un retaggio del modello pre-multi-tenant).
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

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
