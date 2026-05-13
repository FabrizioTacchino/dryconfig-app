
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCcw, Loader, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import EstimateStratigraphiesTable from './EstimateStratigraphiesTable';
import {
  useBulkUpdateEstimateStratigraphyPrices,
  type BulkUpdateReport,
} from '@/hooks/useBulkUpdateEstimateStratigraphyPrices';
import { useEstimateStratigraphiesSorting, EstimateStratigraphySortField } from '@/hooks/useEstimateStratigraphiesSorting';
import BulkUpdatePricesReportDialog from './BulkUpdatePricesReportDialog';
import { isEstimateLocked, lockedStateLabel } from '@/utils/estimates/estimateLock';

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
  const [report, setReport] = useState<BulkUpdateReport | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const { bulkUpdatePricesAsync, isBulkUpdating } = useBulkUpdateEstimateStratigraphyPrices();

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

  // Batch update prezzi: usa l'async per ricevere il report strutturato e
  // mostrare un dialog di esito quando ci sono righe saltate o fallite.
  // Il toast riassuntivo è gestito dall'onSuccess interno del mutation.
  const handleBulkUpdatePrices = async () => {
    if (!canUpdateAllPrices) return;
    try {
      const result = await bulkUpdatePricesAsync({ estimateStratigraphies: stratigrafieSnapshot });
      setReport(result);
      // Apri il dialog solo se c'è qualcosa che richiede attenzione.
      if (result.skipped.length > 0 || result.failed.length > 0) {
        setReportOpen(true);
      }
    } catch (err) {
      // L'onError del mutation ha già mostrato il toast d'errore.
      console.error('[EstimateStratigraphiesSection] bulk update failed:', err);
    }
  };

  const locked = isEstimateLocked(estimateStatus);
  const lockedLabel = lockedStateLabel(estimateStatus);
  const canAddNew = !locked;
  const canUpdateAllPrices = !locked;

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
              {locked && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {lockedLabel.toUpperCase()} · BLOCCATO
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gestisci le stratigrafie associate a questo preventivo
              {locked && (
                <span className="block text-red-600 mt-1 font-medium">
                  ⚠️ Preventivo {lockedLabel.toLowerCase()} - modifiche non consentite. Per riaprirlo riportalo in bozza dall'header.
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button 
              onClick={handleAddFromConfigurator} 
              className={`gap-2 ${!canAddNew ? 'cursor-not-allowed' : ''}`}
              disabled={!canAddNew}
              title={canAddNew ? "Aggiungi nuove stratigrafie" : `Non consentito: preventivo ${lockedLabel.toLowerCase()}`}
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
                disabled={isBulkUpdating || !canUpdateAllPrices}
                title={canUpdateAllPrices ? "Aggiorna tutti i prezzi delle stratigrafie snapshot" : `Non consentito: preventivo ${lockedLabel.toLowerCase()}`}
              >
                {isBulkUpdating ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : canUpdateAllPrices ? (
                  <RefreshCcw className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {isBulkUpdating ? 'Aggiornamento…' : 'Aggiorna Prezzi Tutte'}
              </Button>
            )}
            {report && (
              <Button
                onClick={() => setReportOpen(true)}
                variant="ghost"
                size="sm"
                className="text-xs"
                title="Vedi esito ultimo aggiornamento"
              >
                Vedi esito
              </Button>
            )}
          </div>
        </div>
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

      <BulkUpdatePricesReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        report={report}
      />
    </Card>
  );
};

export default EstimateStratigraphiesSection;
