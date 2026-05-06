
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
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';

interface StratigraphyDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stratigraphy: UnifiedStratigraphy;
  onConfirm: () => void;
  isDeleting: boolean;
}

const StratigraphyDeleteDialog = ({
  open,
  onOpenChange,
  stratigraphy,
  onConfirm,
  isDeleting
}: StratigraphyDeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare la stratigrafia "{stratigraphy.name}"? 
            Questa azione non può essere annullata.
            {stratigraphy.is_certified && (
              <span className="block mt-2 text-amber-600 font-medium">
                Attenzione: Questa è una stratigrafia certificata.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Elimina'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default StratigraphyDeleteDialog;
