import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useCustomers } from '@/hooks/useCustomers';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FREE_TEXT_VALUE = '__free_text__';

const CreateProjectDialog = ({ open, onOpenChange }: CreateProjectDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer_id: '' as string,
    client_free_text: '' as string,
  });

  const { createProject, isCreating } = useProjects();
  const { data: customers = [] } = useCustomers();

  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === formData.customer_id) ?? null,
    [customers, formData.customer_id],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Cliente: o da anagrafica (customer_id) o da testo libero (client legacy).
    // Almeno uno dei due deve essere valorizzato per non rompere il campo "client"
    // che e` NOT NULL nel DB legacy.
    const clientText = selectedCustomer
      ? selectedCustomer.name
      : formData.client_free_text.trim();
    if (!clientText) return;

    createProject(
      {
        name: formData.name.trim(),
        client: clientText,
        description: formData.description.trim(),
        customer_id: selectedCustomer?.id ?? null,
      },
      {
        onSuccess: () => {
          setFormData({ name: '', description: '', customer_id: '', client_free_text: '' });
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuovo Progetto</DialogTitle>
          <DialogDescription>
            Crea un nuovo progetto. Collegalo a un cliente dell'anagrafica per
            l'intestazione automatica dei preventivi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Progetto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="es. Ristrutturazione Uffici Milano"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Cliente *</Label>
              <Select
                value={formData.customer_id || FREE_TEXT_VALUE}
                onValueChange={(v) => setFormData(f => ({
                  ...f,
                  customer_id: v === FREE_TEXT_VALUE ? '' : v,
                }))}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Seleziona dall'anagrafica..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FREE_TEXT_VALUE}>
                    <span className="italic text-muted-foreground">— Testo libero —</span>
                  </SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.city && (
                          <span className="text-xs text-muted-foreground">
                            ({c.city}{c.province ? `, ${c.province}` : ''})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.customer_id && (
                <Input
                  value={formData.client_free_text}
                  onChange={(e) => setFormData(f => ({ ...f, client_free_text: e.target.value }))}
                  placeholder="Scrivi nome cliente (non in anagrafica)"
                  required={!formData.customer_id}
                />
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Link to="/customers" className="underline hover:text-foreground inline-flex items-center gap-1">
                  Gestisci anagrafica clienti <ExternalLink className="h-3 w-3" />
                </Link>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrizione del progetto..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Annulla
            </Button>
            <Button type="submit" disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creazione...' : 'Crea Progetto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
