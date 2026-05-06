import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { EstimateStratigraphy as EstimateStratigraphyType } from '@/types/estimateStratigraphy';

interface EstimateStratigraphyCardProps {
  stratigraphy: EstimateStratigraphyType & { stratigraphy?: any };
  onViewDetails: (stratigraphyId: string) => void;
  onDelete: (stratId: string, name: string) => void;
  onUpdatePrices?: (estimateStratigraphyId: string, originalStratigraphyId: string) => void;
  isDeleting: boolean;
  isUpdatingPrices?: boolean;
}

const EstimateStratigraphyCard = ({ 
  stratigraphy, 
  onViewDetails, 
  onDelete, 
  onUpdatePrices,
  isDeleting,
  isUpdatingPrices = false
}: EstimateStratigraphyCardProps) => {
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleUpdatePrices = () => {
    if (onUpdatePrices && stratigraphy.originalStratigraphyId) {
      onUpdatePrices(stratigraphy.id, stratigraphy.originalStratigraphyId);
    }
  };

  const handleViewDetails = () => {
    // Se è uno snapshot, usa l'ID della stratigraphy snapshot
    // Se non è snapshot ma la stratigraphy originale esiste, usa quello
    // Se la stratigraphy originale non esiste più, non permettere la visualizzazione
    if (stratigraphy.isSnapshot || stratigraphy.stratigraphy) {
      onViewDetails(stratigraphy.stratigraphyId || stratigraphy.id);
    }
  };

  // Determina se la stratigrafia originale è stata eliminata
  const isOrphaned = !stratigraphy.isSnapshot && !stratigraphy.stratigraphy && stratigraphy.stratigraphyId;
  
  // Determina se l'aggiornamento prezzi è disponibile
  const canUpdatePrices = onUpdatePrices && 
    stratigraphy.originalStratigraphyId && 
    stratigraphy.isSnapshot && 
    !isOrphaned;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {stratigraphy.name}
              {isOrphaned && (
                <span title="Stratigrafia originale eliminata">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </span>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {stratigraphy.description}
            </CardDescription>
            <div className="flex gap-2 mt-2">
              {stratigraphy.isSnapshot && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  Copia Indipendente
                </Badge>
              )}
              {isOrphaned && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                  Originale Eliminata
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {(stratigraphy.isSnapshot || stratigraphy.stratigraphy) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewDetails}
                title="Visualizza dettagli"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {canUpdatePrices && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpdatePrices}
                disabled={isUpdatingPrices}
                title="Aggiorna prezzi dalla stratigrafia originale"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(stratigraphy.id, stratigraphy.name)}
              disabled={isDeleting}
              title="Rimuovi dal preventivo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Superficie:</span>
            <div className="font-medium">{stratigraphy.area} m²</div>
          </div>
          <div>
            <span className="text-muted-foreground">Costo unitario:</span>
            <div className="font-medium">€ {stratigraphy.unitCost.toFixed(2)}/m²</div>
          </div>
          <div>
            <span className="text-muted-foreground">Totale:</span>
            <div className="font-semibold text-lg">€ {stratigraphy.totalCost.toFixed(2)}</div>
          </div>
        </div>

        {/* Informazioni sui prezzi aggiornati */}
        {stratigraphy.isSnapshot && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">Prezzi aggiornati al: </span>
              <span className="font-medium">{formatDate(stratigraphy.pricesUpdatedAt)}</span>
            </div>
          </div>
        )}

        {/* Avviso per stratigrafie orfane */}
        {isOrphaned && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              La stratigrafia originale è stata eliminata. Questa voce mantiene i dati salvati al momento dell'inserimento.
            </div>
          </div>
        )}
        
        {/* Dettagli stratigrafia */}
        {stratigraphy.stratigraphy && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">
                {stratigraphy.stratigraphy.type}
              </Badge>
              <span className="text-muted-foreground">
                Spessore: {stratigraphy.stratigraphy.total_thickness}mm
              </span>
              {stratigraphy.stratigraphy.is_certified && (
                <Badge variant="default">Certificata</Badge>
              )}
              {stratigraphy.stratigraphy.fire_resistance_class && (
                <span className="text-muted-foreground">
                  Resistenza al fuoco: {stratigraphy.stratigraphy.fire_resistance_class}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EstimateStratigraphyCard;
