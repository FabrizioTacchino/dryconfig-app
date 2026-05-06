
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import AdminPanel from '@/components/admin/AdminPanel';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const Admin = () => {
  const { isAdmin, isSuperUser, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifica permessi...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isSuperUser) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <Header />
            <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
              <Card className="max-w-md">
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Accesso Negato</h2>
                  <p className="text-muted-foreground">
                    Non hai i permessi necessari per accedere a questa sezione.
                  </p>
                </CardContent>
              </Card>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">
            <AdminPanel />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
