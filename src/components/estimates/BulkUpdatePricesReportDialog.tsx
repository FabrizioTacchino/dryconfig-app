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
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import {
  type BulkUpdateReport,
  bulkUpdateSkipReasonLabel,
} from '@/hooks/useBulkUpdateEstimateStratigraphyPrices';

interface BulkUpdatePricesReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: BulkUpdateReport | null;
}

/**
 * Dialog di esito dell'aggiornamento prezzi bulk.
 *
 * Sostituisce la vecchia "progress bar finta" che non era sincronizzata
 * col backend e nascondeva eventuali skip/failed. Ora mostra ogni riga
 * con il motivo: l'utente sa cosa fare per le stratigrafie skippate
 * (es. "snapshot orfano" → la stratigrafia originale è sparita,
 * va ri-creata o sostituita nel preventivo).
 */
const BulkUpdatePricesReportDialog: React.FC<BulkUpdatePricesReportDialogProps> = ({
  open,
  onOpenChange,
  report,
}) => {
  if (!report) return null;
  const totalProcessed = report.updated.length + report.skipped.length + report.failed.length;
  const realChanges = report.updated.filter(r => r.changed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Esito aggiornamento prezzi</DialogTitle>
          <DialogDescription>
            {totalProcessed} stratigrafie processate · costo orario corrente: €{report.costPerHour}/h
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {report.updated.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="font-medium text-sm">
                  Aggiornate <Badge variant="secondary">{report.updated.length}</Badge>
                  {realChanges > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({realChanges} con prezzo modificato)
                    </span>
                  )}
                </h3>
              </div>
              <ul className="space-y-1 text-sm">
                {report.updated.map(r => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-2 py-1 rounded bg-muted/30">
                    <span className="truncate">{r.name}</span>
                    <span className="font-mono text-xs whitespace-nowrap">
                      {r.changed ? (
                        <>
                          <span className="text-muted-foreground line-through">€{r.oldCost.toFixed(2)}</span>
                          {' → '}
                          <span className="font-medium">€{r.newCost.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">€{r.newCost.toFixed(2)} (invariato)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.skipped.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="font-medium text-sm">
                  Saltate <Badge variant="outline" className="border-amber-300 text-amber-700">{report.skipped.length}</Badge>
                </h3>
              </div>
              <ul className="space-y-1 text-sm">
                {report.skipped.map(r => (
                  <li key={r.id} className="flex items-start justify-between gap-3 px-2 py-1.5 rounded bg-amber-50/50 border border-amber-100">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="text-xs text-amber-800 whitespace-normal text-right">
                      {bulkUpdateSkipReasonLabel(r.reason)}
                      {r.detail && <div className="text-amber-700/70 mt-0.5">{r.detail}</div>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Le stratigrafie saltate non sono state modificate: il prezzo precedente
                è preservato. Verifica la composizione nella stratigrafia originale del catalogo.
              </p>
            </section>
          )}

          {report.failed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <h3 className="font-medium text-sm">
                  Errori <Badge variant="destructive">{report.failed.length}</Badge>
                </h3>
              </div>
              <ul className="space-y-1 text-sm">
                {report.failed.map(r => (
                  <li key={r.id} className="flex items-start justify-between gap-3 px-2 py-1.5 rounded bg-destructive/5 border border-destructive/20">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="text-xs text-destructive whitespace-normal text-right max-w-[60%]">
                      {r.error}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Chiudi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUpdatePricesReportDialog;
