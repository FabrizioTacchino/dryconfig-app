
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Wrench, Package, Shield, Users, Upload, Truck, Sparkles } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { Logo } from '@/components/brand/Logo';

const AppSidebar = () => {
  const location = useLocation();
  const {
    isAdmin,
    isSuperUser
  } = useUserRole();
  const { currentRole } = useCurrentOrganization();
  const canManageTeam = currentRole === 'owner' || currentRole === 'admin';
  const canImportMaterials = ['owner', 'admin', 'technician'].includes(currentRole ?? '');
  // V2 beta: visibile solo in dev (import.meta.env.DEV) o per owner.
  // Quando V2 sarà pronta swappiamo /configurator → ConfiguratorV2 e rimuoviamo questa voce.
  const showConfiguratorV2 = import.meta.env.DEV || currentRole === 'owner';

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
  }, ...(showConfiguratorV2 ? [{
    name: 'Configuratore V2 ✨',
    href: '/configurator-v2',
    icon: Sparkles
  }] : []), {
    name: 'Materiali',
    href: '/materials',
    icon: Package
  }, ...(canImportMaterials ? [{
    name: 'Importa listino',
    href: '/materials/import',
    icon: Upload
  }] : []), ...(canManageTeam ? [{
    name: 'Fornitori',
    href: '/settings/suppliers',
    icon: Truck
  }] : []), ...(canManageTeam ? [{
    name: 'Membri',
    href: '/settings/members',
    icon: Users
  }] : []), ...(isAdmin || isSuperUser ? [{
    name: 'Amministrazione',
    href: '/admin',
    icon: Shield
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
