
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

interface CreateEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEstimate: (data: { name: string; description?: string }) => void;
  isCreating: boolean;
}

const CreateEstimateDialog = ({ 
  open, 
  onOpenChange, 
  onCreateEstimate, 
  isCreating 
}: CreateEstimateDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    onCreateEstimate({
      name: formData.name,
      description: formData.description || undefined,
    });
    
    setFormData({ name: '', description: '' });
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
          <DialogTitle>Nuovo Preventivo</DialogTitle>
          <DialogDescription>
            Crea un nuovo preventivo per questo progetto. Potrai aggiungere pareti e configurazioni successivamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Preventivo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="es. Preventivo Rev. 1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Descrizione del preventivo..."
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
              {isCreating ? 'Creazione...' : 'Crea Preventivo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEstimateDialog;
