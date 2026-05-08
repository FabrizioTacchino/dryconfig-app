import React from 'react';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { Building2 } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  manager: 'Manager',
  technician: 'Tecnico',
  viewer: 'Lettura',
};

export const OrgBadge: React.FC = () => {
  const { currentOrganization, currentRole, loading } = useCurrentOrganization();

  if (loading || !currentOrganization) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium">{currentOrganization.name}</span>
      {currentRole && (
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
          {ROLE_LABEL[currentRole] ?? currentRole}
        </span>
      )}
    </div>
  );
};

export default OrgBadge;
