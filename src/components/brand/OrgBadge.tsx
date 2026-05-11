import React from 'react';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { Building2, ChevronsUpDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  manager: 'Manager',
  technician: 'Tecnico',
  viewer: 'Lettura',
};

/**
 * Badge organizzazione corrente nell'header.
 *
 * Se l'utente è membro di una sola organization → comportamento legacy
 * (badge statico, niente dropdown).
 * Se è membro di più organization → diventa un dropdown switcher con la lista
 * di tutte le membership per cambiare contesto attivo. Il context si occupa
 * dell'invalidate delle query e del persist su localStorage.
 */
export const OrgBadge: React.FC = () => {
  const {
    currentOrganization,
    currentRole,
    memberships,
    switchOrganization,
    loading,
  } = useCurrentOrganization();

  if (loading || !currentOrganization) return null;

  const hasMultiple = memberships.length > 1;

  if (!hasMultiple) {
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
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-border bg-muted/40 hover:bg-muted/80 px-2.5 py-1 text-xs transition-colors"
        >
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium truncate max-w-[180px]">{currentOrganization.name}</span>
          {currentRole && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              {ROLE_LABEL[currentRole] ?? currentRole}
            </span>
          )}
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Cambia organizzazione</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => {
          const isCurrent = m.organization_id === currentOrganization.id;
          return (
            <DropdownMenuItem
              key={m.id}
              onClick={() => !isCurrent && switchOrganization(m.organization_id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{m.organization.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {ROLE_LABEL[m.role] ?? m.role}
                  {m.organization.plan && (
                    <> · piano {m.organization.plan}</>
                  )}
                </div>
              </div>
              {isCurrent && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrgBadge;
