import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, FileText, Lock } from 'lucide-react';
import { useDeleteStratigraphy } from '../hooks/useDeleteStratigraphy';
import { useStratigraphyDeleteImpact } from '../hooks/useStratigraphyDeleteImpact';

interface DeleteStratigraphyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stratigraphyId: string | null;
  stratigraphyName?: string;
  /** Callback opzionale chiamata dopo il delete riuscito (es. per redirect). */
  onDeleted?: () => void;
}

const DeleteStratigraphyDialog: React.FC<DeleteStratigraphyDialogProps> = ({
  open,
  onOpenChange,
  stratigraphyId,
  stratigraphyName,
  onDeleted,
}) => {
  const { deleteStratigraphy, isDeleting } = useDeleteStratigraphy();
  const { data: impact, isLoading: impactLoading } = useStratigraphyDeleteImpact(
    stratigraphyId,
    open,
  );

  const handleConfirm = () => {
    if (!stratigraphyId) return;
    deleteStratigraphy(stratigraphyId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
    });
  };

  const blocked = impact?.hasBlockers ?? false;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare la stratigrafia?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                Stai per eliminare <strong>{stratigraphyName ?? 'questa stratigrafia'}</strong> dal catalogo.
              </p>

              {impactLoading && (
                <p className="text-xs text-muted-foreground">Verifica utilizzo in corso…</p>
              )}

              {/* BLOCKER: walls / wall_configurations FK RESTRICT */}
              {blocked && impact && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                  <Lock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <div className="font-medium text-destructive mb-1">Eliminazione bloccata</div>
                    <div className="text-destructive/90">
                      La stratigrafia è usata in:
                      {impact.wallCount > 0 && <> <strong>{impact.wallCount}</strong> {impact.wallCount === 1 ? 'parete' : 'pareti'} di progetto</>}
                      {impact.wallCount > 0 && impact.wallConfigCount > 0 && ' e '}
                      {impact.wallConfigCount > 0 && <><strong>{impact.wallConfigCount}</strong> {impact.wallConfigCount === 1 ? 'configurazione' : 'configurazioni'}</>}
                      . Rimuovi prima quei riferimenti.
                    </div>
                  </div>
                </div>
              )}

              {/* WARNING: preventivi che la usano */}
              {!blocked && impact && impact.estimateCount > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
                  <FileText className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900">
                    <div className="font-medium mb-1">
                      Usata in {impact.estimateCount} {impact.estimateCount === 1 ? 'preventivo' : 'preventivi'}
                    </div>
                    <div>
                      Lo snapshot dei materiali e dei prezzi resta congelato nei preventivi
                      esistenti, ma non potranno più aggiornare automaticamente i prezzi
                      in caso di variazioni del listino. Sarà comunque possibile <strong>ricollegarli</strong> a
                      una stratigrafia equivalente o editare i prezzi manualmente.
                    </div>
                  </div>
                </div>
              )}

              {/* OK: nessun impatto */}
              {!blocked && impact && impact.estimateCount === 0 && !impactLoading && (
                <p className="text-xs text-muted-foreground">
                  Nessun preventivo o parete utilizza questa stratigrafia.
                </p>
              )}

              {!blocked && (
                <p className="text-xs flex items-center gap-1.5 text-destructive font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  L'azione è irreversibile.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting || blocked || impactLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Elimino…' : blocked ? 'Bloccato' : 'Elimina'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteStratigraphyDialog;
