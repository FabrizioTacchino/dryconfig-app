
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/hooks/useProjects';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProjectDialog = ({ open, onOpenChange }: CreateProjectDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
  });

  const { createProject, isCreating } = useProjects();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.client.trim()) {
      return;
    }

    createProject(formData, {
      onSuccess: () => {
        setFormData({ name: '', client: '', description: '' });
        onOpenChange(false);
      },
    });
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuovo Progetto</DialogTitle>
          <DialogDescription>
            Crea un nuovo progetto di costruzione a secco. Compila i campi obbligatori per iniziare.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Progetto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="es. Ristrutturazione Uffici Milano"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={handleInputChange('client')}
                placeholder="es. Studio Architettura Rossi"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Descrizione del progetto..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creazione...' : 'Crea Progetto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
