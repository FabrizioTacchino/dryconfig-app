
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface PersonalizedStratigraphyValidationProps {
  isNameValid: boolean;
  hasValidLayers: boolean;
  stratigraphyName: string;
  layersCount: number;
}

const PersonalizedStratigraphyValidation = ({
  isNameValid,
  hasValidLayers,
  stratigraphyName,
  layersCount
}: PersonalizedStratigraphyValidationProps) => {
  if (isNameValid && hasValidLayers) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Stratigrafia pronta per il salvataggio! Tutti i campi obbligatori sono compilati correttamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {!isNameValid && stratigraphyName && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Il nome della stratigrafia è obbligatorio e deve contenere almeno un carattere.
          </AlertDescription>
        </Alert>
      )}

      {!hasValidLayers && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {layersCount === 0 
              ? "Aggiungi almeno un layer alla stratigrafia per poterla salvare."
              : "Assicurati che tutti i layer abbiano un materiale selezionato e uno spessore valido."
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PersonalizedStratigraphyValidation;
