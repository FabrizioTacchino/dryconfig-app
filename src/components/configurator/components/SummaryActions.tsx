
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Plus, Edit, AlertTriangle } from 'lucide-react';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SummaryActionsProps {
  hasCustomStratigraphy: boolean;
  hasSelectedStratigraphy: boolean;
  estimateId?: string | null;
  editingStratigraphy?: EstimateStratigraphy & { stratigraphy?: any };
  isWallNameValid: boolean;
  isWallAreaValid: boolean;
  isQuantityValid: boolean;
  isSavingStratigraphy: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  hasValidLayers: boolean;
  onSaveStratigraphy: () => void;
  onSaveAndAddToEstimate: () => void;
  onAddToEstimate: () => void;
  onUpdateStratigraphy: () => void;
}

const SummaryActions = ({
  hasCustomStratigraphy,
  hasSelectedStratigraphy,
  estimateId,
  editingStratigraphy,
  isWallNameValid,
  isWallAreaValid,
  isQuantityValid,
  isSavingStratigraphy,
  isCreating,
  isUpdating,
  hasValidLayers,
  onSaveStratigraphy,
  onSaveAndAddToEstimate,
  onAddToEstimate,
  onUpdateStratigraphy,
}: SummaryActionsProps) => {
  
  // Common validation for forms
  const isFormValid = isWallNameValid && isWallAreaValid && isQuantityValid;
  
  // Check if stratigraphy has valid content
  const canProceed = hasValidLayers && (hasSelectedStratigraphy || hasCustomStratigraphy);
  
  if (editingStratigraphy) {
    // Modalità modifica stratigrafia esistente
    return (
      <div className="space-y-3">
        {!hasValidLayers && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Impossibile aggiornare una stratigrafia vuota. Aggiungi almeno un layer valido.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={onUpdateStratigraphy}
            disabled={!canProceed || !isFormValid || isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aggiornamento...
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Aggiorna Stratigrafia
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (estimateId) {
    // Modalità aggiunta al preventivo
    return (
      <div className="space-y-3">
        {hasCustomStratigraphy && !hasValidLayers && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Impossibile salvare una stratigrafia vuota. Aggiungi almeno un layer valido.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-3">
          {hasCustomStratigraphy && (
            <>
              <Button
                variant="outline"
                onClick={onSaveStratigraphy}
                disabled={!hasValidLayers || isSavingStratigraphy}
              >
                {isSavingStratigraphy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salva Stratigrafia
                  </>
                )}
              </Button>
              
              <Button
                onClick={onSaveAndAddToEstimate}
                disabled={!canProceed || !isFormValid || isSavingStratigraphy || isCreating}
                className="flex-1"
              >
                {isSavingStratigraphy || isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isSavingStratigraphy ? 'Salvataggio...' : 'Aggiunta...'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Salva e Aggiungi al Preventivo
                  </>
                )}
              </Button>
            </>
          )}
          
          {hasSelectedStratigraphy && !hasCustomStratigraphy && (
            <Button
              onClick={onAddToEstimate}
              disabled={!canProceed || !isFormValid || isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiunta...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi al Preventivo
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Modalità standalone (solo salvataggio)
  return (
    <div className="space-y-3">
      {hasCustomStratigraphy && !hasValidLayers && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Impossibile salvare una stratigrafia vuota. Aggiungi almeno un layer valido.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-3">
        {hasCustomStratigraphy && (
          <Button
            onClick={onSaveStratigraphy}
            disabled={!hasValidLayers || isSavingStratigraphy}
          >
            {isSavingStratigraphy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Stratigrafia
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SummaryActions;
