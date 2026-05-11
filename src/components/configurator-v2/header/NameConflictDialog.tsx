import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, User, Pencil, ExternalLink, Save, FilePlus2 } from 'lucide-react';
import type { NameConflict } from '../hooks/useConfiguratorState';

interface NameConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: NameConflict | null;
  pendingAction: 'save' | 'addToEstimate';
  /** L'utente conferma di salvare nonostante il duplicato (consenso esplicito). */
  onForceSave: () => void;
  /** L'utente abbandona e apre la stratigrafia esistente. */
  onOpenExisting: () => void;
  /** L'utente vuole modificare il nome (chiude il dialog, focus implicito). */
  onChangeName: () => void;
}

/**
 * Dialog di conflitto nome: avvisa l'utente che esiste già un'altra
 * stratigrafia con lo stesso nome nell'organization e propone 3 azioni
 * (apri esistente / cambia nome / salva comunque).
 *
 * Niente UNIQUE constraint a DB perché legacy potrebbe già contenere
 * duplicati e bloccherebbe il save: il check è applicativo.
 */
const NameConflictDialog: React.FC<NameConflictDialogProps> = ({
  open,
  onOpenChange,
  existing,
  pendingAction,
  onForceSave,
  onOpenExisting,
  onChangeName,
}) => {
  if (!existing) return null;

  const forceLabel = pendingAction === 'addToEstimate'
    ? 'Salva comunque e aggiungi a preventivo'
    : 'Salva comunque';
  const ForceIcon = pendingAction === 'addToEstimate' ? FilePlus2 : Save;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nome stratigrafia già usato</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                Esiste già una stratigrafia con il nome{' '}
                <strong>"{existing.name}"</strong> nella tua organizzazione:
              </p>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                {existing.isCertified ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-700">Certificata</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-zinc-500 shrink-0" />
                    <span className="text-xs text-zinc-600">Personalizzata</span>
                  </>
                )}
                <span className="font-medium truncate">{existing.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Avere due stratigrafie con lo stesso nome non rompe nulla
                tecnicamente, ma rende difficile distinguerle nei preventivi
                e nella lista. Cosa vuoi fare?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:gap-2 sm:space-x-0">
          <Button variant="outline" onClick={onOpenExisting} className="gap-1.5 w-full sm:w-auto">
            <ExternalLink className="h-4 w-4" />
            Apri esistente
          </Button>
          <Button variant="outline" onClick={onChangeName} className="gap-1.5 w-full sm:w-auto">
            <Pencil className="h-4 w-4" />
            Cambia nome
          </Button>
          <Button onClick={onForceSave} className="gap-1.5 w-full sm:w-auto">
            <ForceIcon className="h-4 w-4" />
            {forceLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NameConflictDialog;
