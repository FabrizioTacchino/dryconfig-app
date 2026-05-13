
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Wrench, Package, Users, Upload, Truck, Building2 } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { useHasFeature } from '@/hooks/useOrgPlan';
import { Logo } from '@/components/brand/Logo';

const AppSidebar = () => {
  const location = useLocation();
  const { currentRole } = useCurrentOrganization();
  const canManageTeam = currentRole === 'owner' || currentRole === 'admin';
  const canImportMaterials = ['owner', 'admin', 'supervisor', 'technician'].includes(currentRole ?? '');
  // Feature-gate: pagina Membri disponibile solo su piano Team (vedi PRICING.md).
  // Piani Trial e Studio in futuro: Trial sblocca tutto per provarlo; Studio limita a 3 utenti senza la pagina avanzata.
  const hasMembersFeature = useHasFeature('members');

  const navigation = [{
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  }, {
    name: 'Progetti',
    href: '/projects',
    icon: FolderOpen
  }, {
    name: 'Configuratore',
    href: '/configurator',
    icon: Wrench
  }, {
    name: 'Materiali',
    href: '/materials',
    icon: Package
  }, ...(canImportMaterials ? [{
    name: 'Importa listino',
    href: '/materials/import',
    icon: Upload
  }] : []), ...(canManageTeam ? [{
    name: 'Organizzazione',
    href: '/settings/organization',
    icon: Building2
  }] : []), ...(canManageTeam ? [{
    name: 'Fornitori',
    href: '/settings/suppliers',
    icon: Truck
  }] : []), ...(canManageTeam && hasMembersFeature ? [{
    name: 'Membri',
    href: '/settings/members',
    icon: Users
  }] : [])];
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-center">
        <Logo size={28} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Navigazione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(item => 
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href} size="sm">
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
