
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';

interface ConfiguratorLoadingStateProps {
  message: string;
}

const ConfiguratorLoadingState = ({ message }: ConfiguratorLoadingStateProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{message}</p>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ConfiguratorLoadingState;
