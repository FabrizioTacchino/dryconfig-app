import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, Link2, ShieldCheck, User, AlertCircle, FilePlus2 } from 'lucide-react';
import MiniSectionPreview from '@/components/configurator-v2/list-view/MiniSectionPreview';
import { normalizeSnapshotLayers } from '@/components/configurator-v2/hooks/normalizeSnapshotLayers';
import {
  useReconnectCandidates,
  useReconnectStratigraphy,
} from '@/hooks/useReconnectStratigraphy';
import type { EstimateStratigraphy } from '@/types/estimateStratigraphy';

interface ReconnectStratigraphyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: (EstimateStratigraphy & { layersData?: unknown }) | null;
}

/**
 * Dialog "Ricollega al catalogo" per row preventivo orfane (originale
 * eliminata). Cerca stratigrafie con composizione simile e propone le
 * top 5. Selezione → ricollega + re-snapshot dei dati freschi.
 *
 * Dopo il ricollegamento, sulla row riappare il bottone "Aggiorna Prezzi"
 * standard, perché il `original_stratigraphy_id` è di nuovo popolato.
 */
const ReconnectStratigraphyDialog: React.FC<ReconnectStratigraphyDialogProps> = ({
  open,
  onOpenChange,
  item,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();
  // Normalizzo i layer dello snapshot (DB-shape → V2-shape) così:
  // - MiniSectionPreview rende correttamente la preview
  // - useReconnectCandidates calcola fingerprint corretto via fingerprintComposition
  const orphanLayers = normalizeSnapshotLayers(
    Array.isArray(item?.layersData) ? (item!.layersData as unknown[]) : []
  );
  const { data: candidates = [], isLoading } = useReconnectCandidates(orphanLayers, open);
  const reconnect = useReconnectStratigraphy();

  /**
   * F5.6: porta l'utente al configuratore con la composizione orfana
   * pre-caricata, così può ricreare la stratigrafia nel catalogo.
   * Dopo il save dovrà tornare al preventivo e ricollegare manualmente.
   */
  const handleCreateFromSnapshot = () => {
    if (!item) return;
    onOpenChange(false);
    navigate(`/configurator?fromEstimateStratigraphy=${item.id}`);
  };

  const handleConfirm = async () => {
    if (!item || !selectedId) return;
    await reconnect.mutateAsync({
      estimateStratigraphyId: item.id,
      catalogStratigraphyId: selectedId,
    });
    onOpenChange(false);
    setSelectedId(null);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelectedId(null); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Ricollega "{item.name}" al catalogo
          </DialogTitle>
          <DialogDescription>
            La stratigrafia originale è stata eliminata. Scegli una stratigrafia del
            catalogo con composizione simile per ripristinare l'aggiornamento automatico
            dei prezzi.
          </DialogDescription>
        </DialogHeader>

        {/* Preview composizione orfana per contesto visivo. Aiuta l'utente
            a capire cosa sta cercando — soprattutto se ha più preventivi
            con stratigrafie diverse. */}
        {orphanLayers.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 flex items-center gap-3">
            <div className="w-20 h-14 border border-amber-200 rounded overflow-hidden bg-white shrink-0">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <MiniSectionPreview layers={orphanLayers as any} className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-amber-900 font-medium mb-0.5">Composizione attuale (snapshot orfano)</div>
              <div className="text-[11px] text-amber-800/80">
                {orphanLayers.length} {orphanLayers.length === 1 ? 'layer' : 'layer'} · area {item.area.toFixed(2)} m² · €{item.unitCost.toFixed(2)}/m²
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cerco candidate…
            </div>
          )}

          {!isLoading && candidates.length === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900">
                <div className="font-medium mb-1">Nessuna stratigrafia simile trovata nel catalogo</div>
                <div className="text-xs">
                  Puoi ricreare la stratigrafia direttamente dallo snapshot:
                  apre il configuratore con i layer già pre-caricati. Una volta
                  salvata torna qui e ricollegala. In alternativa, modifica
                  il prezzo manualmente sulla riga del preventivo.
                </div>
              </div>
            </div>
          )}

          {!isLoading && candidates.length > 0 && (
            <ul className="space-y-2">
              {candidates.map((cand) => {
                const isSelected = selectedId === cand.id;
                return (
                  <li key={cand.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(cand.id)}
                      className={`w-full text-left rounded-lg border p-3 flex gap-3 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="w-20 h-14 border border-zinc-200 rounded overflow-hidden bg-white shrink-0">
                        {cand.rawLayers.length > 0 && (
                          <MiniSectionPreview
                            layers={cand.rawLayers}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm truncate">{cand.name}</span>
                          <Badge
                            variant="outline"
                            className={cand.isCertified
                              ? 'text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1'
                              : 'text-[10px] bg-zinc-50 text-zinc-600 border-zinc-200 gap-1'
                            }
                          >
                            {cand.isCertified ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {cand.isCertified ? 'Certificata' : 'Personalizzata'}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.round(cand.score * 100)}% match
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                          {cand.totalThicknessMm != null && <span>{Math.round(cand.totalThicknessMm)} mm</span>}
                          {cand.acousticRw != null && <span>Rw {cand.acousticRw} dB</span>}
                          {cand.fireResistanceClass && <span>{cand.fireResistanceClass}</span>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={reconnect.isPending}>
            Annulla
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateFromSnapshot}
            disabled={reconnect.isPending || orphanLayers.length === 0}
            className="gap-1.5"
            title="Apri il configuratore con i layer dello snapshot pre-caricati"
          >
            <FilePlus2 className="h-4 w-4" />
            Crea da snapshot
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedId || reconnect.isPending}
            className="gap-1.5"
          >
            {reconnect.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ricollegando…
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Ricollega selezionata
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReconnectStratigraphyDialog;
