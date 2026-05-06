
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useEstimateStratigraphies } from '@/hooks/useEstimateStratigraphies';
import { useEstimate } from '@/hooks/useEstimate';
import EstimateHeader from './components/EstimateHeader';
import EstimateStratigraphyCard from './components/EstimateStratigraphyCard';
import EstimateTotals from './components/EstimateTotals';
import EmptyEstimateState from './components/EmptyEstimateState';

interface SummaryTabProps {
  estimateId?: string | null;
}

const SummaryTab = ({ estimateId }: SummaryTabProps) => {
  const navigate = useNavigate();
  const { estimate, isLoading: isLoadingEstimate } = useEstimate(estimateId || '');
  const { 
    estimateStratigraphies, 
    isLoading, 
    deleteEstimateStratigraphy, 
    updateStratigraphyPrices,
    isDeleting,
    isUpdatingPrices,
    totalCost 
  } = useEstimateStratigraphies(estimateId || undefined);

  const handleDeleteStratigraphy = (stratId: string, name: string) => {
    if (window.confirm(`Sei sicuro di voler rimuovere "${name}" dal preventivo?`)) {
      deleteEstimateStratigraphy(stratId, {
        onSuccess: () => {
          toast.success('Stratigrafia rimossa dal preventivo');
        },
        onError: () => {
          toast.error('Errore nella rimozione della stratigrafia');
        }
      });
    }
  };

  const handleUpdatePrices = (estimateStratigraphyId: string, originalStratigraphyId: string) => {
    updateStratigraphyPrices(estimateStratigraphyId, originalStratigraphyId);
  };

  const handleViewDetails = (stratigraphyId: string) => {
    // Naviga al configuratore con la stratigrafia selezionata per visualizzare i dettagli
    navigate(`/configurator?estimate=${estimateId}&stratigraphyId=${stratigraphyId}`);
  };

  if (isLoadingEstimate || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
          <span>Caricamento riepilogo...</span>
        </CardContent>
      </Card>
    );
  }

  if (!estimateId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Non Disponibile</CardTitle>
          <CardDescription>
            Il riepilogo è disponibile solo quando si lavora su un preventivo specifico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Per utilizzare questa funzione, accedi al configuratore tramite un preventivo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del preventivo */}
      <EstimateHeader 
        estimateName={estimate?.name}
        stratigraphiesCount={estimateStratigraphies.length}
        totalCost={totalCost}
      />

      {/* Lista delle stratigrafie */}
      {estimateStratigraphies.length === 0 ? (
        <EmptyEstimateState estimateId={estimateId} />
      ) : (
        <div className="space-y-4">
          {estimateStratigraphies.map((estStrat) => (
            <EstimateStratigraphyCard
              key={estStrat.id}
              stratigraphy={estStrat}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteStratigraphy}
              onUpdatePrices={handleUpdatePrices}
              isDeleting={isDeleting}
              isUpdatingPrices={isUpdatingPrices}
            />
          ))}
        </div>
      )}

      {/* Azioni del riepilogo */}
      {estimateStratigraphies.length > 0 && (
        <EstimateTotals 
          totalCost={totalCost}
          estimateId={estimateId}
        />
      )}
    </div>
  );
};

export default SummaryTab;
