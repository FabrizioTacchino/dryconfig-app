
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCcw, Loader, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import EstimateStratigraphiesTable from './EstimateStratigraphiesTable';
import { useBulkUpdateEstimateStratigraphyPrices } from '@/hooks/useBulkUpdateEstimateStratigraphyPrices';
import { useEstimateStratigraphiesSorting, EstimateStratigraphySortField } from '@/hooks/useEstimateStratigraphiesSorting';

interface EstimateStratigraphiesSectionProps {
  stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[];
  estimateId: string;
  estimateStatus?: string;
  onUpdateStratigraphy: (id: string, data: any) => void;
  onDeleteStratigraphy: (id: string) => void;
  onUpdatePrices?: (estimateStratigraphyId: string, originalStratigraphyId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isUpdatingPrices?: boolean;
}

const EstimateStratigraphiesSection = ({
  stratigraphies,
  estimateId,
  estimateStatus = 'draft',
  onUpdateStratigraphy,
  onDeleteStratigraphy,
  onUpdatePrices,
  isUpdating,
  isDeleting,
  isUpdatingPrices = false,
}: EstimateStratigraphiesSectionProps) => {
  const navigate = useNavigate();
  const [updatingAll, setUpdatingAll] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressMax, setProgressMax] = useState<number | null>(null);
  const { bulkUpdatePrices, isBulkUpdating } = useBulkUpdateEstimateStratigraphyPrices();

  // Funzione per aggiungere dal Configuratore
  const handleAddFromConfigurator = () => {
    if (!canAddNew) {
      return; // Non navigare se il preventivo è contrattualizzato
    }
    navigate(`/configurator?estimate=${estimateId}`);
  };

  // --- HOOK ORDINAMENTO
  const {
    sortField,
    sortDirection,
    setSort,
    getSortedStratigraphies,
  } = useEstimateStratigraphiesSorting();

  // Ottengo solo le stratigrafie snapshot vere
  const stratigrafieSnapshot = stratigraphies.filter(s => s.isSnapshot);

  // Funzione per batch update
  const handleBulkUpdatePrices = () => {
    if (!canUpdateAllPrices) {
      return; // Non eseguire se il preventivo è contrattualizzato
    }

    setUpdatingAll(true);
    setProgress(0);
    setProgressMax(stratigrafieSnapshot.length);
    // Per UX: progress bar finta, backend non fornisce lo stato -- la resettiamo dopo ~2s
    bulkUpdatePrices({
      estimateStratigraphies: stratigrafieSnapshot,
    });
    let curr = 0;
    const intv = setInterval(() => {
      curr++;
      setProgress(Math.min(curr, stratigrafieSnapshot.length));
      if (curr >= stratigrafieSnapshot.length) {
        clearInterval(intv);
        setTimeout(() => {
          setUpdatingAll(false);
          setProgress(null);
          setProgressMax(null);
        }, 800);
      }
    }, 400);
  };

  const isContracted = estimateStatus === 'contracted';
  const canAddNew = !isContracted;
  const canUpdateAllPrices = !isContracted;

  const handleSortChange = (field: EstimateStratigraphySortField) => {
    setSort(field);
  };

  // Usa le stratigrafie ordinate per la tabella
  const sortedStratigraphies = getSortedStratigraphies(stratigraphies);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Stratigrafie del Preventivo
              {isContracted && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  CONTRATTUALIZZATO
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gestisci le stratigrafie associate a questo preventivo
              {isContracted && (
                <span className="block text-red-600 mt-1 font-medium">
                  ⚠️ Preventivo contrattualizzato - modifiche non consentite
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button 
              onClick={handleAddFromConfigurator} 
              className={`gap-2 ${!canAddNew ? 'cursor-not-allowed' : ''}`}
              disabled={!canAddNew}
              title={canAddNew ? "Aggiungi nuove stratigrafie" : "Non consentito: preventivo contrattualizzato"}
            >
              {canAddNew ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Aggiungi dal Configuratore
            </Button>
            {stratigrafieSnapshot.length > 0 && (
              <Button
                onClick={handleBulkUpdatePrices}
                className={`gap-2 ${canUpdateAllPrices ? 'bg-primary/90 hover:bg-primary text-primary-foreground' : ''}`}
                variant="outline"
                disabled={isBulkUpdating || updatingAll || !canUpdateAllPrices}
                title={canUpdateAllPrices ? "Aggiorna tutti i prezzi delle stratigrafie snapshot" : "Non consentito: preventivo contrattualizzato"}
              >
                {isBulkUpdating || updatingAll ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : canUpdateAllPrices ? (
                  <RefreshCcw className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Aggiorna Prezzi Tutte
              </Button>
            )}
          </div>
        </div>
        {/* Visual progress (anche finto, migliora UX) */}
        {(isBulkUpdating || updatingAll) && stratigrafieSnapshot.length > 0 && (
          <div className="mt-2 flex items-center gap-2 w-full">
            <Progress value={progress !== null ? (progress / (progressMax || 1)) * 100 : 0} max={100} />
            <span className="text-xs text-muted-foreground ml-2">
              Aggiornamento prezzi in corso...
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <EstimateStratigraphiesTable
          stratigraphies={sortedStratigraphies}
          estimateStatus={estimateStatus}
          onUpdateStratigraphy={onUpdateStratigraphy}
          onDeleteStratigraphy={onDeleteStratigraphy}
          onUpdatePrices={onUpdatePrices}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          isUpdatingPrices={isUpdatingPrices}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </CardContent>
    </Card>
  );
};

export default EstimateStratigraphiesSection;
