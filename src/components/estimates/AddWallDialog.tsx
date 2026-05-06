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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateEstimateWallData } from '@/types/estimate';

interface AddWallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWall: (wallData: CreateEstimateWallData) => void;
  isCreating: boolean;
}

const AddWallDialog = ({ 
  open, 
  onOpenChange, 
  onAddWall, 
  isCreating 
}: AddWallDialogProps) => {
  const [formData, setFormData] = useState<CreateEstimateWallData>({
    name: '',
    wallType: 'single',
    area: 0,
    pricePerSqm: 0,
    materialCost: 0,
    laborCost: 0,
    accessoriesCost: 0,
    notes: '',
  });

  const wallTypeOptions = [
    { value: 'plating', label: 'Placcatura' },
    { value: 'counterwall', label: 'Controparete' },
    { value: 'single', label: 'Parete singola' },
    { value: 'double', label: 'Parete doppia' },
    { value: 'ceiling', label: 'Controsoffitto' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    onAddWall(formData);
    
    setFormData({
      name: '',
      wallType: 'single',
      area: 0,
      pricePerSqm: 0,
      materialCost: 0,
      laborCost: 0,
      accessoriesCost: 0,
      notes: '',
    });
  };

  const handleInputChange = (field: keyof CreateEstimateWallData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      wallType: value as CreateEstimateWallData['wallType'],
    }));
  };

  const totalCost = formData.materialCost + formData.laborCost + formData.accessoriesCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Parete</DialogTitle>
          <DialogDescription>
            Aggiungi una nuova parete al preventivo con i relativi costi.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Parete *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="es. Parete Nord"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wallType">Tipologia *</Label>
                <Select value={formData.wallType} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wallTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area (m²) *</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.area}
                  onChange={handleInputChange('area')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pricePerSqm">Prezzo per m²</Label>
                <Input
                  id="pricePerSqm"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pricePerSqm}
                  onChange={handleInputChange('pricePerSqm')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="materialCost">Costo Materiali (€)</Label>
                <Input
                  id="materialCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.materialCost}
                  onChange={handleInputChange('materialCost')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="laborCost">Costo Manodopera (€)</Label>
                <Input
                  id="laborCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.laborCost}
                  onChange={handleInputChange('laborCost')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessoriesCost">Costo Accessori (€)</Label>
                <Input
                  id="accessoriesCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.accessoriesCost}
                  onChange={handleInputChange('accessoriesCost')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Totale Parete</Label>
              <div className="text-lg font-semibold text-primary">
                € {totalCost.toFixed(2)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Note aggiuntive..."
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
              {isCreating ? 'Aggiunta...' : 'Aggiungi Parete'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWallDialog;
