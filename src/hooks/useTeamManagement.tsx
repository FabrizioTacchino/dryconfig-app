import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type OrganizationRole = Database['public']['Enums']['organization_role'];

export interface TeamMember {
  membership_id: string;
  user_id: string;
  role: OrganizationRole;
  is_default: boolean;
  joined_at: string;
  email: string;
  name: string | null;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  invited_by: string | null;
}

// =====================================================================
// Members
// =====================================================================
export const useOrganizationMembers = () => {
  const { currentOrganizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ['org-members', currentOrganizationId],
    enabled: !!currentOrganizationId,
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          is_default,
          joined_at,
          profiles:profiles!organization_members_user_id_fkey (
            email,
            name
          )
        `)
        .eq('organization_id', currentOrganizationId!)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((m: any) => ({
        membership_id: m.id,
        user_id: m.user_id,
        role: m.role,
        is_default: m.is_default,
        joined_at: m.joined_at,
        email: m.profiles?.email ?? '',
        name: m.profiles?.name ?? null,
      }));
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ membershipId, newRole }: { membershipId: string; newRole: OrganizationRole }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', currentOrganizationId] });
      toast.success('Ruolo aggiornato');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', currentOrganizationId] });
      toast.success('Membro rimosso');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};

// =====================================================================
// Invitations
// =====================================================================
export const useOrganizationInvitations = () => {
  const { currentOrganizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ['org-invitations', currentOrganizationId],
    enabled: !!currentOrganizationId,
    queryFn: async (): Promise<TeamInvitation[]> => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', currentOrganizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamInvitation[];
    },
  });
};

export const useInviteMember = () => {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: OrganizationRole }) => {
      if (!currentOrganizationId) throw new Error('Nessuna organizzazione attiva');

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error('Email mancante');

      const { data, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: currentOrganizationId,
          email: cleanEmail,
          role,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as TeamInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invitations', currentOrganizationId] });
      toast.success('Invito creato. Copia il link e invialo al destinatario.');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};

export const useRevokeInvitation = () => {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.rpc('revoke_invitation', { p_invitation_id: invitationId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invitations', currentOrganizationId] });
      toast.success('Invito revocato');
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`),
  });
};

// =====================================================================
// Accept invitation (called from /invite/:token page)
// =====================================================================
export interface InvitationPreview {
  invitation_id: string;
  organization_id: string;
  organization_name: string;
  invitation_email: string;
  invitation_role: OrganizationRole;
  expires_at: string;
  is_accepted: boolean;
  is_expired: boolean;
  is_revoked: boolean;
}

export const useInvitationPreview = (token: string | null) => {
  return useQuery({
    queryKey: ['invitation-preview', token],
    enabled: !!token,
    queryFn: async (): Promise<InvitationPreview | null> => {
      const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as InvitationPreview | undefined) ?? null;
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
      if (error) throw error;
      return data as string; // organization_id
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};
