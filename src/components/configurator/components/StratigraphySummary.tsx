
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Edit, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateActualThickness } from '../utils/stratigraphyUtils';

interface StratigraphySummaryProps {
  totalThickness: number;
  layersCount: number;
  estimatedCost: number;
  weightPerSqm: number;
  canSave: boolean;
  isNameValid: boolean;
  hasValidLayers: boolean;
  isSaving: boolean;
  onSave: () => void;
  isEditMode?: boolean;
  layers?: any[];
}

const StratigraphySummary = ({
  totalThickness,
  layersCount,
  estimatedCost,
  weightPerSqm,
  canSave,
  isNameValid,
  hasValidLayers,
  isSaving,
  onSave,
  isEditMode = false,
  layers = [],
}: StratigraphySummaryProps) => {
  const validLayersCount = layersCount;
  
  // Use the correct thickness calculation that matches the preview
  const correctedThickness = layers.length > 0 ? calculateActualThickness(layers) : totalThickness;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riepilogo Stratigrafia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Alert for Empty Stratigraphy */}
        {!hasValidLayers && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Stratigrafia vuota</strong>
              <br />
              Aggiungi almeno un layer con materiale e spessore validi per poter salvare la stratigrafia.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Spessore Totale</p>
            <Badge variant="outline" className="text-sm">
              {correctedThickness.toFixed(1)} mm
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Layer Validi</p>
            <Badge variant="outline" className="text-sm">
              {validLayersCount} layer{validLayersCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Costo Stimato</p>
            <Badge variant="outline" className="text-sm">
              €{estimatedCost.toFixed(2)}/m²
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Peso</p>
            <Badge variant="outline" className="text-sm">
              {weightPerSqm.toFixed(2)} kg/m²
            </Badge>
          </div>
        </div>

        {/* Additional validation messages */}
        {!isNameValid && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Inserisci un nome per la stratigrafia
            </AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <Button 
          onClick={onSave} 
          disabled={!canSave || isSaving || !hasValidLayers}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditMode ? 'Aggiornamento...' : 'Salvataggio...'}
            </>
          ) : (
            <>
              {isEditMode ? <Edit className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isEditMode ? 'Aggiorna Stratigrafia' : 'Salva Stratigrafia'}
            </>
          )}
        </Button>

        {/* Help text */}
        {!canSave && (
          <p className="text-xs text-muted-foreground text-center">
            {!hasValidLayers 
              ? 'Aggiungi layer con materiali validi per salvare'
              : 'Completa tutti i campi obbligatori per salvare'
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StratigraphySummary;
