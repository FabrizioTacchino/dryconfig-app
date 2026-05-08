
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StructureSuggestion } from '../hooks/useAutoSuggestStructure';

interface StructureSuggestionDialogProps {
  suggestion: StructureSuggestion | null;
  onAccept: () => void;
  onDecline: () => void;
}

const StructureSuggestionDialog = ({
  suggestion,
  onAccept,
  onDecline
}: StructureSuggestionDialogProps) => {
  if (!suggestion) return null;

  const categoryLabels = {
    montanti: 'Montanti',
    guide: 'Guide'
  };

  // Sezione utile del profilo (mm), preferito su thickness (che per i profili è NULL)
  const sezione = suggestion.suggestedMaterial.width
    ? `sezione ${suggestion.suggestedMaterial.width} mm`
    : suggestion.suggestedMaterial.thickness
      ? `${suggestion.suggestedMaterial.thickness} mm`
      : 'n/a';
  const lamiera = suggestion.suggestedMaterial.sheet_thickness
    ? ` · lamiera ${suggestion.suggestedMaterial.sheet_thickness} mm`
    : '';

  return (
    <Dialog open={!!suggestion} onOpenChange={() => onDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Aggiungi {categoryLabels[suggestion.type]} associate?
            <Badge variant="outline">{suggestion.suggestedMaterial.supplier}</Badge>
          </DialogTitle>
          <DialogDescription>
            Hai selezionato un{' '}
            <strong>
              {suggestion.type === 'montanti' ? 'Guida' : 'Montante'}
            </strong>
            {' '}con <strong>{sezione}{lamiera}</strong>.{` `}
            Vuoi aggiungere automaticamente anche{' '}
            <strong>
              {categoryLabels[suggestion.type].toLowerCase()}
            </strong>{' '}
            abbinati dello stesso fornitore?
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-3 bg-muted/50">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">
              {suggestion.suggestedMaterial.name}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span>Codice:</span> {suggestion.suggestedMaterial.code}
              </div>
              <div>
                <span>Prezzo:</span> €{suggestion.suggestedMaterial.unit_price.toFixed(2)}/{suggestion.suggestedMaterial.unit}
              </div>
              <div>
                <span>Sezione:</span> {sezione}{lamiera}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDecline} className="w-full sm:w-auto">
            No, grazie
          </Button>
          <Button onClick={onAccept} className="w-full sm:w-auto">
            Sì, aggiungi automaticamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StructureSuggestionDialog;

