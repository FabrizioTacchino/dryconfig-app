
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, FolderIcon, UserIcon, Trash2 } from 'lucide-react';
import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useEstimates } from '@/hooks/useEstimates';
import { useProjects } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { estimates } = useEstimates(project.id);
  const { deleteProject, isDeleting } = useProjects();
  
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusLabels = {
    active: 'Attivo',
    completed: 'Completato',
    archived: 'Archiviato',
  };

  const totalAmount = estimates.reduce((sum, estimate) => sum + estimate.totalAmount, 0);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteProject(project.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="relative group">
        <Link to={`/projects/${project.id}`}>
          <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg line-clamp-2">{project.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge className={cn("ml-2", statusColors[project.status])}>
                    {statusLabels[project.status]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                {project.description || 'Nessuna descrizione disponibile'}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>{project.client}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <FolderIcon className="h-4 w-4 mr-2" />
                  <span>{estimates.length} preventiv{estimates.length === 1 ? 'o' : 'i'}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>{project.createdAt.toLocaleDateString('it-IT')}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-muted/50 px-6 py-3 flex justify-between">
              <span className="text-sm font-medium">€ {totalAmount.toLocaleString('it-IT')}</span>
              <span className="text-sm text-muted-foreground">
                {estimates.length} preventiv{estimates.length === 1 ? 'o' : 'i'}
              </span>
            </CardFooter>
          </Card>
        </Link>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Progetto</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il progetto "{project.name}"? 
              Questa azione eliminerà anche tutti i preventivi associati e non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectCard;
