
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Wrench, Package, Shield } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';

const AppSidebar = () => {
  const location = useLocation();
  const {
    isAdmin,
    isSuperUser
  } = useUserRole();
  
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
  }, ...(isAdmin || isSuperUser ? [{
    name: 'Amministrazione',
    href: '/admin',
    icon: Shield
  }] : [])];
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/af9a8f4f-c139-4c9c-8347-b9a09c5f7d00.png" alt="DryConfig" className="h-6 w-6" />
          <h2 className="font-bold text-construction-primary text-xl">DryConfig</h2>
        </div>
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
