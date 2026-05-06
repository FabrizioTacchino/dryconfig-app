
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';

const EstimateErrorState = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">
            <div className="py-12 text-center">
              <p className="text-destructive">Preventivo non trovato</p>
              <Button 
                onClick={() => navigate('/projects')} 
                className="mt-4"
                variant="outline"
              >
                Torna ai Progetti
              </Button>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default EstimateErrorState;
