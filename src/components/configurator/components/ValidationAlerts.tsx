
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ValidationAlertsProps {
  estimateId?: string | null;
  isWallNameValid?: boolean;
  isWallAreaValid?: boolean;
  wallName?: string;
  wallArea?: number;
  // Stratigraphy validation props
  isNameValid?: boolean;
  hasValidLayers?: boolean;
  stratigraphyName?: string;
  layersCount?: number;
}

const ValidationAlerts = ({ 
  estimateId, 
  isWallNameValid, 
  isWallAreaValid, 
  wallName, 
  wallArea,
  isNameValid,
  hasValidLayers,
  stratigraphyName,
  layersCount
}: ValidationAlertsProps) => {
  // Wall validation alerts
  if (estimateId) {
    return (
      <>
        {isWallNameValid !== undefined && !isWallNameValid && wallName && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Inserisci un nome valido per la parete</AlertDescription>
          </Alert>
        )}
        
        {isWallAreaValid !== undefined && !isWallAreaValid && wallArea !== undefined && wallArea !== 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Inserisci una superficie maggiore di 0</AlertDescription>
          </Alert>
        )}
      </>
    );
  }

  // Stratigraphy validation alerts
  return (
    <>
      {isNameValid !== undefined && !isNameValid && stratigraphyName && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Inserisci un nome valido per la stratigrafia</AlertDescription>
        </Alert>
      )}
      
      {hasValidLayers !== undefined && !hasValidLayers && layersCount !== undefined && layersCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Configura almeno un layer valido</AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default ValidationAlerts;
