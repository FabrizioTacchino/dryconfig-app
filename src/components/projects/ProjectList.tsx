
import React, { useState } from 'react';
import ProjectCard from './ProjectCard';
import CreateProjectDialog from './CreateProjectDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';

const ProjectList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { user } = useAuth();
  const { projects, isLoading, error } = useProjects();
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Effettua il login per visualizzare i tuoi progetti</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Caricamento progetti...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">Errore nel caricamento dei progetti</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca progetti..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full sm:w-[180px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="completed">Completati</SelectItem>
                <SelectItem value="archived">Archiviati</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          className="w-full sm:w-auto"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Progetto
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        
        {filteredProjects.length === 0 && projects.length > 0 && (
          <div className="col-span-3 py-12 text-center">
            <p className="text-muted-foreground">Nessun progetto trovato con i filtri applicati</p>
          </div>
        )}

        {projects.length === 0 && (
          <div className="col-span-3 py-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">Nessun progetto ancora</h3>
              <p className="text-muted-foreground mb-4">
                Inizia creando il tuo primo progetto di costruzione a secco
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crea il tuo primo progetto
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateProjectDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
};

export default ProjectList;
