
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Lock } from 'lucide-react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { useMaterialCoefficients } from '@/hooks/useMaterialCoefficients';
import { useCreateEstimateStratigraphy } from '@/hooks/useCreateEstimateStratigraphy';
import { useEstimates } from '@/hooks/useEstimates';
import { useEstimateStratigraphiesQuery } from '@/hooks/useEstimateStratigraphiesQuery';
import { toast } from 'sonner';

interface AddToEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stratigraphy: DatabaseStratigraphy;
}

const AddToEstimateDialog = ({
  open,
  onOpenChange,
  stratigraphy
}: AddToEstimateDialogProps) => {
  const [selectedEstimateId, setSelectedEstimateId] = useState('');
  const [name, setName] = useState(stratigraphy.name);
  const [description, setDescription] = useState(stratigraphy.description || '');
  const [area, setArea] = useState<number>(10);
  const [finishLevel, setFinishLevel] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [wallHeight, setWallHeight] = useState<number>(2.7);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const { estimates } = useEstimates();
  const { materialCoefficients } = useMaterialCoefficients();
  const { createEstimateStratigraphy, isCreating } = useCreateEstimateStratigraphy();
  const { estimateStratigraphies } = useEstimateStratigraphiesQuery(selectedEstimateId);

  // Trova il preventivo selezionato
  const selectedEstimate = estimates.find(e => e.id === selectedEstimateId);
  const isEstimateContracted = selectedEstimate?.status === 'contracted';

  // Check if stratigraphy already exists in selected estimate
  const isDuplicateStratigraphy = selectedEstimateId && estimateStratigraphies.some(
    existingItem => existingItem.stratigraphyId === stratigraphy.id
  );

  const calculateMaterials = () => {
    if (!stratigraphy.layers) return {};
    
    const materials: any = {};

    // Calcola materiali principali per ogni layer
    stratigraphy.layers.forEach(layer => {
      const material = layer.material;
      if (!material) return;

      const materialKey = `${material.category}_${material.id}`;
      
      if (material.category === 'board') {
        materials[materialKey] = {
          name: material.name,
          category: material.category,
          quantity: area,
          unit: material.unit || 'mq'
        };
      } else if (material.category === 'structure') {
        const interAxis = layer.inter_axis || 600;
        const linearMeters = (area / wallHeight) * (1000 / interAxis);
        materials[materialKey] = {
          name: material.name,
          category: material.category,
          quantity: linearMeters * wallHeight,
          unit: 'ml'
        };
      } else if (material.category === 'insulation') {
        materials[materialKey] = {
          name: material.name,
          category: material.category,
          quantity: area,
          unit: 'mq'
        };
      }
    });

    materialCoefficients.forEach(coeff => {
      if (coeff.finish_level === finishLevel) {
        const accessoryKey = `accessory_${coeff.coefficient_type}`;
        materials[accessoryKey] = {
          name: coeff.coefficient_type.replace('_', ' '),
          category: 'accessory',
          quantity: area * coeff.coefficient_value,
          unit: coeff.unit
        };
      }
    });

    return materials;
  };

  const handleEstimateChange = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
    setShowDuplicateWarning(false);
  };

  const handleSubmit = () => {
    if (!selectedEstimateId) {
      toast.error('Seleziona un preventivo');
      return;
    }

    // Controllo preventivo contrattualizzato
    if (isEstimateContracted) {
      toast.error('Impossibile aggiungere stratigrafie: preventivo contrattualizzato');
      return;
    }

    // Check for duplicate stratigraphy
    if (isDuplicateStratigraphy) {
      setShowDuplicateWarning(true);
      return;
    }

    const calculatedMaterials = calculateMaterials();
    const unitCost = stratigraphy.cost_per_sqm || 0;
    const totalCost = unitCost * area;

    createEstimateStratigraphy({
      estimateId: selectedEstimateId,
      stratigraphyId: stratigraphy.id,
      name,
      description,
      area,
      quantity: 1,
      unitCost,
      totalCost,
      finishLevel,
      wallHeight,
      calculatedMaterials
    }, {
      onSuccess: () => {
        toast.success('Stratigrafia aggiunta al preventivo!');
        onOpenChange(false);
        // Reset form
        setName(stratigraphy.name);
        setDescription(stratigraphy.description || '');
        setArea(10);
        setFinishLevel('Q2');
        setWallHeight(2.7);
        setSelectedEstimateId('');
        setShowDuplicateWarning(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi al Preventivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selezione Preventivo */}
          <div className="space-y-2">
            <Label htmlFor="estimate">Preventivo</Label>
            <Select value={selectedEstimateId} onValueChange={handleEstimateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un preventivo..." />
              </SelectTrigger>
              <SelectContent>
                {estimates.map((estimate) => (
                  <SelectItem key={estimate.id} value={estimate.id}>
                    <div className="flex items-center gap-2">
                      <span>
                        {estimate.projectName ? `${estimate.projectName} - ${estimate.name}` : estimate.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {estimate.status}
                      </Badge>
                      {estimate.status === 'contracted' && (
                        <Lock className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning for contracted estimate */}
          {isEstimateContracted && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Preventivo Contrattualizzato:</strong> Non è possibile aggiungere nuove stratigrafie a questo preventivo.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for duplicate stratigraphy */}
          {showDuplicateWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Attenzione:</strong> la stratigrafia è già presente nel preventivo. 
                Per modificarne la superficie, utilizzare il pulsante 'Modifica'.
              </AlertDescription>
            </Alert>
          )}

          {/* Informazioni Base */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="area">Superficie (mq)</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Anteprima Calcoli */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Anteprima Materiali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Superficie:</span>
                  <span>{area.toFixed(2)} mq</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo unitario:</span>
                  <span>€{(stratigraphy.cost_per_sqm || 0).toFixed(2)}/mq</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Costo totale:</span>
                  <span>€{((stratigraphy.cost_per_sqm || 0) * area).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isCreating || !selectedEstimateId || isDuplicateStratigraphy || isEstimateContracted}
            >
              {isCreating ? 'Aggiunta in corso...' : 'Aggiungi al Preventivo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToEstimateDialog;
