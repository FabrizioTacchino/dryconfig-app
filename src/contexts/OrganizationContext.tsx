import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export type OrganizationRole = Database['public']['Enums']['organization_role'];

export interface MembershipWithOrg {
  id: string;
  organization_id: string;
  role: OrganizationRole;
  is_default: boolean;
  joined_at: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    trial_ends_at: string | null;
    country_code: string;
    settings: Record<string, unknown>;
  };
}

interface OrganizationContextType {
  loading: boolean;
  memberships: MembershipWithOrg[];
  currentOrganizationId: string | null;
  currentOrganization: MembershipWithOrg['organization'] | null;
  currentRole: OrganizationRole | null;
  switchOrganization: (organizationId: string) => void;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'dryconfig.currentOrganizationId';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useCurrentOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (ctx === undefined) {
    throw new Error('useCurrentOrganization must be used within an OrganizationProvider');
  }
  return ctx;
};

export const OrganizationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data: memberships = [], isLoading, refetch } = useQuery({
    queryKey: ['memberships', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MembershipWithOrg[]> => {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          role,
          is_default,
          joined_at,
          organization:organizations!organization_members_organization_id_fkey (
            id,
            name,
            slug,
            plan,
            trial_ends_at,
            country_code,
            settings
          )
        `)
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as MembershipWithOrg[];
    },
  });

  // When memberships load, ensure selectedOrgId is valid; otherwise pick the default.
  useEffect(() => {
    if (memberships.length === 0) {
      setSelectedOrgId(null);
      return;
    }
    const stillValid = selectedOrgId && memberships.some(m => m.organization_id === selectedOrgId);
    if (!stillValid) {
      const defaultMembership = memberships.find(m => m.is_default) ?? memberships[0];
      setSelectedOrgId(defaultMembership.organization_id);
    }
  }, [memberships, selectedOrgId]);

  // Persist selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedOrgId) localStorage.setItem(STORAGE_KEY, selectedOrgId);
    else localStorage.removeItem(STORAGE_KEY);
  }, [selectedOrgId]);

  const switchOrganization = (organizationId: string) => {
    if (memberships.some(m => m.organization_id === organizationId)) {
      setSelectedOrgId(organizationId);
      // Invalidate queries that depend on the current organization
      queryClient.invalidateQueries();
    }
  };

  const value = useMemo<OrganizationContextType>(() => {
    const currentMembership = memberships.find(m => m.organization_id === selectedOrgId) ?? null;
    return {
      loading: isLoading,
      memberships,
      currentOrganizationId: selectedOrgId,
      currentOrganization: currentMembership?.organization ?? null,
      currentRole: currentMembership?.role ?? null,
      switchOrganization,
      refresh: async () => { await refetch(); },
    };
  }, [memberships, selectedOrgId, isLoading]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};
