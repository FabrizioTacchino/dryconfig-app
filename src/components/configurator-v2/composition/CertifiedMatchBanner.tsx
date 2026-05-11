import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
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
import type { CertifiedMatch } from '../hooks/useCertifiedMatch';

interface CertifiedMatchBannerProps {
  match: CertifiedMatch;
  /** Conferma l'apertura della certificata corrispondente (sostituisce lo stato corrente). */
  onReplace: (certifiedId: string) => void;
  /** L'utente sceglie di continuare con la personalizzata: nasconde il banner. */
  onDismiss: () => void;
}

/**
 * Banner non bloccante mostrato sopra la lista layer quando la composizione
 * corrente matcha (loose) una stratigrafia certificata già presente nel
 * catalogo dell'organization. Aiuta l'utente a riusare un sistema certificato
 * invece di ricostruirlo da zero.
 *
 * Per evitare di sovrascrivere lavoro accidentalmente, "Sostituisci" passa
 * per un AlertDialog di conferma esplicita.
 */
const CertifiedMatchBanner: React.FC<CertifiedMatchBannerProps> = ({ match, onReplace, onDismiss }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Costruisci sottotitolo con i parametri certificati disponibili
  const specs: string[] = [];
  if (match.acousticRw != null) specs.push(`Rw ${match.acousticRw} dB`);
  if (match.fireResistanceClass) specs.push(match.fireResistanceClass);
  if (match.totalThicknessMm != null) specs.push(`${Math.round(match.totalThicknessMm)} mm`);

  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-blue-900">
              Composizione simile a una stratigrafia certificata
            </span>
            <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700 bg-white">
              {Math.round(match.score * 100)}% match
            </Badge>
          </div>
          <div className="text-sm text-blue-900/90 truncate font-medium">
            {match.name}
          </div>
          {(specs.length > 0 || match.certificationLab) && (
            <div className="text-xs text-blue-800/70 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
              {specs.map(s => <span key={s}>{s}</span>)}
              {match.certificationLab && (
                <span>· cert. {match.certificationLab}{match.certificationCode ? ` (${match.certificationCode})` : ''}</span>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="gap-1.5 h-7"
            >
              Apri certificata <ArrowRight className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-7 text-blue-800 hover:bg-blue-100"
            >
              Continua personalizzata
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Chiudi suggerimento"
          className="flex-shrink-0 text-blue-700/60 hover:text-blue-900 p-0.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprire la stratigrafia certificata?</AlertDialogTitle>
            <AlertDialogDescription>
              Verrai portato sulla certificata <strong>"{match.name}"</strong>.
              Il lavoro non salvato sulla stratigrafia personalizzata corrente verrà perso.
              <br /><br />
              Se vuoi mantenerla, prima salvala con un nome diverso, poi torna qui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => onReplace(match.id)}>
              Apri certificata
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CertifiedMatchBanner;
