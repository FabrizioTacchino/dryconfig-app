import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarIcon, UserIcon, Pencil, Check, X } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import EstimatesList from '@/components/estimates/EstimatesList';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { ProjectStatus } from '@/types';
import ProjectStatusBadgeEditable from "@/components/projects/ProjectStatusBadgeEditable";
import ProjectNameEditable from "@/components/projects/ProjectNameEditable";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <div>ID progetto non trovato</div>;
  }

  const { project, isLoading, error } = useProject(id);

  // Stato per edit in-line nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [tmpName, setTmpName] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Eliminati tutti gli stati e funzioni legati allo stato progetto, ora gestiti dal componente specializzato.

  // Colori e label stato rimossi (usati ora internamente al componente ProjectStatusBadgeEditable)

  // Handler salvataggio nuovo nome: (rimane identico)
  const handleSaveName = async () => {
    if (!tmpName || tmpName.trim() === '') {
      toast({ title: 'Il nome non può essere vuoto' });
      return;
    }
    setIsSaving(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error: updateError } = await supabase
        .from('projects')
        .update({ name: tmpName })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({ title: 'Nome progetto aggiornato!' });
      setIsEditingName(false);
      setTmpName(undefined);
      window.location.reload(); // Aggiorna subito come da convention
    } catch (err) {
      toast({ title: 'Errore nel salvataggio del nome' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <Header />
            <main className="flex-1 p-6 md:p-8">
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Caricamento progetto...</p>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !project) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <Header />
            <main className="flex-1 p-6 md:p-8">
              <div className="py-12 text-center">
                <p className="text-destructive">Progetto non trovato o errore nel caricamento</p>
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
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">
            <div className="mb-8">
              <Button 
                onClick={() => navigate('/projects')} 
                variant="ghost" 
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Progetti
              </Button>
              <div className="flex justify-between items-start">
                <div>
                  {/* Refactored: Gestione nome progetto */}
                  <ProjectNameEditable
                    name={project.name}
                    projectId={project.id}
                  />
                  <p className="text-muted-foreground mt-1">
                    {project.description || "Nessuna descrizione disponibile"}
                  </p>
                </div>
                {/* Refactored: Badge stato progetto */}
                <ProjectStatusBadgeEditable
                  status={project.status}
                  projectId={project.id}
                />
              </div>
            </div>
            <div className="grid gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Progetto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm">
                      <UserIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-medium mr-2">Cliente:</span>
                      <span>{project.client}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-medium mr-2">Creato:</span>
                      <span>{project.createdAt.toLocaleDateString("it-IT")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <EstimatesList projectId={id} />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ProjectDetail;
