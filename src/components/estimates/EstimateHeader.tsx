
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Pencil, X, Check, FileText, FileStack, ChevronDown,
  Send, Trophy, XCircle, Undo2, AlertTriangle, ShoppingCart,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGenerateOfferNumber } from "@/hooks/useOfferNumber";
import { Estimate, LostReason } from '@/types';
import ExportDropdown from './ExportDropdown';
import EstimateStatusBadge from './EstimateStatusBadge';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useEstimates } from '@/hooks/useEstimates';
import EstimateNotesField from "./EstimateNotesField";
import { useEstimateNotes } from "@/hooks/useEstimateNotes";
import { useOrgProfile } from "@/hooks/useOrgSettings";
import { useMaterialsSummary } from "@/hooks/useMaterialsSummary";
import { Sentry } from "@/lib/sentry";
import { isEstimateLocked } from '@/utils/estimates/estimateLock';

interface EstimateHeaderProps {
  estimate: Estimate;
  stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[];
}

const LOST_REASON_OPTIONS: { value: LostReason; label: string; hint: string }[] = [
  { value: 'price', label: 'Prezzo troppo alto', hint: 'Il cliente ha trovato offerte piu` economiche' },
  { value: 'timing', label: 'Tempi non compatibili', hint: 'Non si è riusciti a rispettare le tempistiche richieste' },
  { value: 'competitor', label: 'Concorrente scelto', hint: 'Il cliente ha preferito un altro fornitore' },
  { value: 'no_response', label: 'Cliente non ha risposto', hint: 'Nessun feedback dopo l\'invio dell\'offerta' },
  { value: 'other', label: 'Altro motivo', hint: 'Motivo non classificabile o specifico del singolo cliente' },
];

const EstimateHeader = ({ estimate, stratigraphies }: EstimateHeaderProps) => {
  const navigate = useNavigate();
  const { updateEstimateStatus, isUpdatingStatus, updateLostReason, isUpdatingLostReason } = useEstimates();
  const [isEditing, setIsEditing] = useState(false);
  const [tmpName, setTmpName] = useState(estimate.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingRDA, setIsExportingRDA] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState<LostReason>('price');
  /**
   * F30 bonus: distingue "Segna come perso" (transizione → setta lost_at +
   * lost_reason) da "Modifica motivo" (solo lost_reason, niente timestamp).
   */
  const [lostDialogMode, setLostDialogMode] = useState<'transition' | 'edit'>('transition');
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const { data: orgProfile } = useOrgProfile();
  const generateOfferNumber = useGenerateOfferNumber();
  // F31: usato dall'export "Ordine al fornitore". Stessa fonte del riepilogo
  // materiali a video → coerenza prezzi/quantità garantita.
  const { materialsSummary } = useMaterialsSummary(stratigraphies);

  const status = estimate.status;
  const locked = isEstimateLocked(status);

  // Funzione per aggiornare solo il nome del preventivo
  const handleSaveName = async () => {
    if (tmpName.trim() === '') {
      toast({ title: 'Il nome non può essere vuoto' });
      return;
    }
    setIsSaving(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('estimates')
        .update({ name: tmpName })
        .eq('id', estimate.id);

      if (error) throw error;
      toast({ title: 'Nome preventivo aggiornato!' });
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Errore nel salvataggio del nome' });
    }
    setIsSaving(false);
  };

  // Gestione notes
  const { saveNotes, isSaving: isSavingNotes } = useEstimateNotes(estimate.id);

  /**
   * Genera (o legge) il numero offerta e poi esegue l'export.
   * Variant:
   *  - 'sintetico'        → preventivo cliente
   *  - 'completo'         → preventivo cantiere/tecnico
   *  - 'ordine_fornitori' → lista materiali raggruppata per supplier (F31)
   *
   * L'ordine al fornitore non ha bisogno del numero offerta (è interno) ma
   * lo riportiamo se gia` presente per tracciabilita`.
   */
  const handleExportOffer = async (
    variant: 'sintetico' | 'completo' | 'ordine_fornitori',
  ) => {
    if (isExportingRDA) return;
    setIsExportingRDA(true);
    try {
      const needsOfferNumber = variant !== 'ordine_fornitori';
      let offerNumber = estimate.offerNumber as string | null | undefined;
      let issuedAt = estimate.offerIssuedAt as Date | null | undefined;
      if (needsOfferNumber && !offerNumber) {
        const info = await generateOfferNumber.mutateAsync(estimate.id);
        offerNumber = info.offer_number;
        issuedAt = new Date();
      }
      const enrichedEstimate = {
        ...estimate,
        offerNumber: offerNumber ?? null,
        offerIssuedAt: issuedAt ?? new Date(),
      };

      const exp = await import('@/utils/export');
      if (variant === 'sintetico') {
        await exp.exportSyntheticOffer({
          estimate: enrichedEstimate,
          stratigraphies,
          org: orgProfile ?? null,
        });
      } else if (variant === 'completo') {
        await exp.exportCompleteRDA(enrichedEstimate, stratigraphies, orgProfile ?? null);
      } else {
        await exp.exportSupplierOrder({
          estimate: enrichedEstimate,
          materials: materialsSummary,
          org: orgProfile ?? null,
        });
      }
      const labels: Record<typeof variant, string> = {
        sintetico: 'Preventivo Sintetico',
        completo: 'Preventivo Completo',
        ordine_fornitori: 'Ordine ai fornitori',
      };
      toast({
        title: `${labels[variant]} generato`,
        description: offerNumber && needsOfferNumber
          ? `Numero offerta: ${offerNumber}`
          : 'Documento scaricato',
      });
    } catch (error) {
      console.error('Errore export preventivo:', error);
      Sentry.captureException(error, {
        tags: { feature: 'export-offer', variant },
        extra: {
          estimateId: estimate?.id,
          stratigraphyCount: stratigraphies?.length,
        },
      });
      const errMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Errore generazione documento',
        description: errMsg.slice(0, 200),
        variant: 'destructive',
      });
    } finally {
      setIsExportingRDA(false);
    }
  };

  /**
   * F30 — workflow transitions. Non c'è una macchina a stati rigida: vogliamo
   * permettere agli utenti di correggere errori (es. ho marcato come "vinto"
   * un preventivo sbagliato → riporto in bozza). Quindi consentiamo qualunque
   * transizione, salvo richiedere il motivo quando si va in `lost`.
   */
  const goSent = () => updateEstimateStatus(estimate.id, 'sent');
  const goWon = () => updateEstimateStatus(estimate.id, 'won');
  const goLostConfirm = () => {
    if (lostDialogMode === 'edit') {
      // F30 bonus: aggiorna solo lost_reason, niente nuovo lost_at.
      updateLostReason(estimate.id, lostReason);
    } else {
      // Transizione vera in lost: setta lost_at + lost_reason in atomico.
      updateEstimateStatus(estimate.id, 'lost', lostReason);
    }
    setLostDialogOpen(false);
  };
  const openEditLostReason = () => {
    // Precarica il motivo attuale (se presente) nel dialog.
    const current = (estimate.lostReason as LostReason | null) ?? 'price';
    setLostReason(current);
    setLostDialogMode('edit');
    setLostDialogOpen(true);
  };
  const openLostTransition = () => {
    setLostReason('price');
    setLostDialogMode('transition');
    setLostDialogOpen(true);
  };
  const reopen = () => {
    updateEstimateStatus(estimate.id, 'draft');
    setReopenDialogOpen(false);
  };

  return (
    <div className="mb-8">
      <div className="flex gap-2">
        <Button
          onClick={() => navigate(`/projects/${estimate.projectId}`)}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al Progetto
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div className="flex flex-col gap-1 w-full max-w-2xl">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Input
                  value={tmpName}
                  onChange={(e) => setTmpName(e.target.value)}
                  className="max-w-xs"
                  disabled={isSaving}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setTmpName(estimate.name);
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveName}
                  disabled={isSaving}
                  aria-label="Salva"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setTmpName(estimate.name);
                  }}
                  disabled={isSaving}
                  aria-label="Annulla"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">
                  {estimate.name}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  aria-label="Modifica nome">
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {estimate.description || 'Gestisci le stratigrafie e i costi del preventivo'}
          </p>
          {/* NOTE FIELD AGGIORNATA GRAFICAMENTE */}
          <div className="w-full max-w-xl mt-2">
            <EstimateNotesField
              note={estimate.notes}
              onSave={async (text) => { await saveNotes(text); }}
              disabled={isSavingNotes}
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <EstimateStatusBadge status={status} />

            {/* F30 — Workflow buttons */}
            {(status === 'draft' || status === 'pending') && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={goSent}
                disabled={isUpdatingStatus}
              >
                <Send className="h-4 w-4" />
                Marca come inviato
              </Button>
            )}
            {(status === 'sent' || status === 'pending') && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={goWon}
                  disabled={isUpdatingStatus}
                >
                  <Trophy className="h-4 w-4" />
                  Cliente accettato
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={openLostTransition}
                  disabled={isUpdatingStatus}
                >
                  <XCircle className="h-4 w-4" />
                  Segna come perso
                </Button>
              </>
            )}
            {/* F30 bonus: modifica solo il motivo di un preventivo già perso,
                senza ricreare il timestamp lost_at. */}
            {status === 'lost' && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                onClick={openEditLostReason}
                disabled={isUpdatingStatus || isUpdatingLostReason}
              >
                <Pencil className="h-4 w-4" />
                Modifica motivo
              </Button>
            )}
            {locked && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setReopenDialogOpen(true)}
                disabled={isUpdatingStatus}
              >
                <Undo2 className="h-4 w-4" />
                Riapri (torna in bozza)
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isExportingRDA}
                >
                  <FileStack className="h-4 w-4" />
                  {isExportingRDA ? 'Generando...' : 'Genera preventivo'}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Scegli il formato del preventivo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportOffer('sintetico')}>
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">Preventivo Sintetico</span>
                    <span className="text-xs text-muted-foreground">
                      Per il cliente · 2-3 pagine · prezzi finali + IVA
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportOffer('completo')}>
                  <FileStack className="h-4 w-4 mr-2 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">Preventivo Completo</span>
                    <span className="text-xs text-muted-foreground">
                      Per il cantiere · composizione + acquisti + tutto
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportOffer('ordine_fornitori')}>
                  <ShoppingCart className="h-4 w-4 mr-2 text-orange-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">Ordine ai fornitori</span>
                    <span className="text-xs text-muted-foreground">
                      Da inviare al rappresentante · raggruppato per fornitore
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ExportDropdown estimate={estimate} stratigraphies={stratigraphies} />
          </div>
        </div>
      </div>

      {/* Dialog: motivo perdita (transition o edit) */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {lostDialogMode === 'edit' ? 'Modifica motivo perdita' : 'Segna preventivo come perso'}
            </DialogTitle>
            <DialogDescription>
              {lostDialogMode === 'edit'
                ? 'Aggiorna il motivo registrato. La data di perdita resta invariata.'
                : 'Registra il motivo della perdita: ti aiuta a tracciare i pattern di vendita nella dashboard e capire dove migliorare. Puoi sempre riaprire il preventivo in seguito.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Motivo</label>
            <Select value={lostReason} onValueChange={(v) => setLostReason(v as LostReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOST_REASON_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.hint}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLostDialogOpen(false)}
              disabled={isUpdatingStatus || isUpdatingLostReason}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={goLostConfirm}
              disabled={isUpdatingStatus || isUpdatingLostReason}
            >
              {lostDialogMode === 'edit' ? 'Salva motivo' : 'Conferma perdita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert: riapri preventivo chiuso */}
      <AlertDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Riaprire il preventivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Il preventivo tornerà in <strong>Bozza</strong> e potrai di nuovo modificarne
              stratigrafie e prezzi. I timestamp di "vinto"/"perso" verranno cancellati e dovrai
              ri-registrarli quando concluderai di nuovo la trattativa. Il numero offerta e
              la data di emissione restano invariati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={reopen} disabled={isUpdatingStatus}>
              Riapri in bozza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EstimateHeader;
