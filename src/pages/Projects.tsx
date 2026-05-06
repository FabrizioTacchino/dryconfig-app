
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import ProjectList from '@/components/projects/ProjectList';

const Projects = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Progetti</h1>
              <p className="text-muted-foreground mt-1">
                Gestisci i tuoi progetti di costruzione a secco
              </p>
            </div>
            
            <ProjectList />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Projects;
