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
import { Unlink, ShieldCheck, User } from 'lucide-react';
import MiniSectionPreview from '@/components/configurator-v2/list-view/MiniSectionPreview';
import { normalizeSnapshotLayers } from '@/components/configurator-v2/hooks/normalizeSnapshotLayers';
import type { EstimateStratigraphy } from '@/types/estimateStratigraphy';

interface SnapshotViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: (EstimateStratigraphy & {
    stratigraphy?: { name?: string; is_certified?: boolean; total_thickness?: number; acoustic_performance?: number; fire_resistance_class?: string };
    layersData?: unknown;
  }) | null;
  /** Callback per aprire il dialog "Ricollega" da qui (vista orfana). */
  onReconnect?: () => void;
}

/**
 * Dialog read-only per visualizzare lo snapshot di una stratigrafia di
 * preventivo quando l'originale del catalogo è stata eliminata. Niente
 * navigazione al configuratore (che fallirebbe perché l'id catalogo è null):
 * mostra dati congelati + CTA per ricollegare al catalogo.
 */
const SnapshotViewerDialog: React.FC<SnapshotViewerDialogProps> = ({
  open,
  onOpenChange,
  item,
  onReconnect,
}) => {
  if (!item) return null;
  // Snapshot in DB ha shape snake_case (`layer.materials`); MiniSectionPreview
  // e wallModel leggono camelCase (`layer.material`). Normalizzo per renderizzare
  // correttamente — altrimenti compare "Nessun layer".
  const layers = normalizeSnapshotLayers(item.layersData as unknown[] | null);
  const strat = item.stratigraphy ?? {};
  const isCertified = Boolean(strat.is_certified);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.name}
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200 gap-1">
              <Unlink className="h-3 w-3" />
              Snapshot orfano
            </Badge>
          </DialogTitle>
          <DialogDescription>
            La stratigrafia originale è stata eliminata dal catalogo. Visualizzi
            i dati congelati al momento dell'aggiunta al preventivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview SVG dallo snapshot */}
          <div className="border rounded-lg p-3 bg-zinc-50/50 flex items-center gap-3">
            <div className="w-32 h-24 border border-zinc-200 rounded overflow-hidden bg-white shrink-0">
              {layers.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <MiniSectionPreview layers={layers as any} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  N/A
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge
                  variant="outline"
                  className={isCertified
                    ? 'text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1'
                    : 'text-[10px] bg-zinc-50 text-zinc-600 border-zinc-200 gap-1'
                  }
                >
                  {isCertified ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {isCertified ? 'Certificata' : 'Personalizzata'}
                </Badge>
                {strat.total_thickness != null && (
                  <Badge variant="outline" className="text-[10px]">
                    {Math.round(Number(strat.total_thickness))} mm
                  </Badge>
                )}
                {strat.acoustic_performance != null && (
                  <Badge variant="outline" className="text-[10px]">
                    Rw {strat.acoustic_performance} dB
                  </Badge>
                )}
                {strat.fire_resistance_class && (
                  <Badge variant="outline" className="text-[10px]">{strat.fire_resistance_class}</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Area: <span className="font-mono">{item.area.toFixed(2)} m²</span> · Costo: <span className="font-mono">€ {item.unitCost.toFixed(2)}/m²</span>
              </div>
            </div>
          </div>

          {/* Lista layer */}
          {layers.length > 0 && (
            <div>
              <div className="text-xs font-medium text-zinc-700 mb-2">Composizione (snapshot)</div>
              <ul className="border rounded-lg divide-y">
                {layers.map((layer, idx) => {
                  // I layer ora sono normalizzati in V2-shape (camelCase)
                  // dal `normalizeSnapshotLayers`.
                  const mat = layer.material;
                  return (
                    <li key={layer.id ?? idx} className="px-3 py-2 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{idx + 1}</span>
                        <span className="truncate">{mat?.name ?? '—'}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {String(mat?.category ?? 'altro').replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground shrink-0">
                        {Number(layer.thickness ?? 0).toFixed(1)} mm
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
          {onReconnect && (
            <Button onClick={() => { onOpenChange(false); onReconnect(); }} className="gap-1.5">
              <Unlink className="h-4 w-4" />
              Ricollega al catalogo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SnapshotViewerDialog;
