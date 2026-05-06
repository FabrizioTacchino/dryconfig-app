
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConfiguratorErrorStateProps {
  editStratigraphyId: string;
}

const ConfiguratorErrorState = ({ editStratigraphyId }: ConfiguratorErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">
            <div className="mb-8">
              <Button 
                onClick={() => navigate('/configurator')}
                variant="ghost" 
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna al Configuratore
              </Button>
              
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Stratigrafia non trovata</strong>
                  <br />
                  La stratigrafia che stai cercando di modificare (ID: {editStratigraphyId}) non esiste più nel database o potrebbe essere in uno stato inconsistente.
                  <br />
                  <br />
                  <Button 
                    onClick={() => navigate('/configurator')}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Vai al Configuratore
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ConfiguratorErrorState;
