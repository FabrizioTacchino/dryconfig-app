import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Volume2, Weight, Ruler, Receipt, ShieldCheck, User } from 'lucide-react';
import type { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';
import type { LayerV2 } from '../types';
import { buildWallSectionModel } from '../visualization/section-view/wallModel';
import MiniSectionPreview from './MiniSectionPreview';

interface CompareStratigraphiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stratigraphies: UnifiedStratigraphy[];
  /** ID iniziali pre-selezionati nelle 3 colonne (opzionale). */
  initialIds?: (string | undefined)[];
}

const SLOTS = 3;

/**
 * Dialog di confronto fra 2-3 stratigrafie affiancate.
 *
 * Per ogni colonna mostra:
 *  - Select per scegliere la stratigrafia
 *  - Mini section preview
 *  - Tabella metriche (EI · Rw · λ · peso · spessore · costo)
 *  - Tipologia + numero layer + badge certificata
 */
const CompareStratigraphiesDialog: React.FC<CompareStratigraphiesDialogProps> = ({
  open,
  onOpenChange,
  stratigraphies,
  initialIds = [],
}) => {
  const [picked, setPicked] = useState<(string | undefined)[]>([
    initialIds[0],
    initialIds[1],
    initialIds[2],
  ]);

  const stratById = useMemo(() => {
    const map = new Map<string, UnifiedStratigraphy>();
    for (const s of stratigraphies) map.set(s.id, s);
    return map;
  }, [stratigraphies]);

  const selected = picked.map((id) => (id ? stratById.get(id) : undefined));

  // Spessore reale (con isolante dentro struttura) per ognuno
  const realThickness = selected.map((s) => {
    if (!s) return 0;
    const ordered = [...((s.layers ?? []) as unknown as LayerV2[])].sort(
      (a: any, b: any) => Number(a?.position ?? 0) - Number(b?.position ?? 0),
    );
    return buildWallSectionModel(ordered).totalThicknessMm;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confronta stratigrafie</DialogTitle>
          <DialogDescription>
            Scegli fino a 3 stratigrafie per metterle a confronto fianco a fianco e decidere quale
            inserire nel tuo preventivo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: SLOTS }).map((_, i) => {
            const s = selected[i];
            const layers = (s?.layers ?? []) as unknown as LayerV2[];
            const cost = s?.comprehensive_cost_per_sqm ?? s?.cost_per_sqm ?? 0;
            return (
              <Card key={i} className="p-3 flex flex-col gap-3">
                {/* Selettore */}
                <Select
                  value={picked[i] ?? ''}
                  onValueChange={(v) => {
                    const next = [...picked];
                    next[i] = v || undefined;
                    setPicked(next);
                  }}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder={`Stratigrafia ${i + 1}…`} />
                  </SelectTrigger>
                  <SelectContent>
                    {stratigraphies.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{opt.name}</span>
                          {opt.is_certified && (
                            <ShieldCheck className="h-3 w-3 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!s ? (
                  <div className="flex-1 min-h-[300px] flex items-center justify-center text-xs text-zinc-400 border border-dashed rounded">
                    Slot vuoto
                  </div>
                ) : (
                  <>
                    {/* Header card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-zinc-900 truncate" title={s.name}>
                          {s.name}
                        </h3>
                        {s.description && (
                          <p className="text-[10px] text-zinc-500 truncate">{s.description}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          s.is_certified
                            ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px] shrink-0'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 text-[10px] shrink-0'
                        }
                      >
                        {s.is_certified ? (
                          <><ShieldCheck className="h-2.5 w-2.5 mr-1" /> Cert.</>
                        ) : (
                          <><User className="h-2.5 w-2.5 mr-1" /> Custom</>
                        )}
                      </Badge>
                    </div>

                    {/* Mini section */}
                    <div className="h-28 rounded border bg-white">
                      <MiniSectionPreview layers={layers} className="w-full h-full" />
                    </div>

                    {/* Metriche tabellate */}
                    <div className="space-y-1 text-xs">
                      <CompareRow
                        icon={<Flame className="h-3 w-3 text-orange-600" />}
                        label="Resistenza fuoco"
                        value={s.fire_resistance_class || '—'}
                      />
                      <CompareRow
                        icon={<Volume2 className="h-3 w-3 text-blue-600" />}
                        label="Acustica Rw"
                        value={s.acoustic_performance ? `${Math.round(Number(s.acoustic_performance))} dB` : '—'}
                      />
                      <CompareRow
                        icon={<Weight className="h-3 w-3 text-zinc-600" />}
                        label="Peso"
                        value={s.weight_per_sqm ? `${Number(s.weight_per_sqm).toFixed(1)} kg/m²` : '—'}
                      />
                      <CompareRow
                        icon={<Ruler className="h-3 w-3 text-zinc-600" />}
                        label="Spessore"
                        value={`${realThickness[i].toFixed(0)} mm`}
                      />
                      <CompareRow
                        icon={<Receipt className="h-3 w-3 text-emerald-600" />}
                        label="Costo €/m²"
                        value={cost > 0 ? `€ ${cost.toFixed(2)}` : '—'}
                        emphasized
                      />
                    </div>

                    <div className="text-[10px] text-zinc-500 pt-2 border-t">
                      {layers.length} layer · {s.is_certified ? 'Certificata' : 'Personalizzata'}
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CompareRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasized?: boolean;
}> = ({ icon, label, value, emphasized }) => (
  <div
    className={`flex items-center justify-between gap-2 ${
      emphasized ? 'pt-1 border-t border-zinc-100 font-semibold text-zinc-900' : 'text-zinc-600'
    }`}
  >
    <span className="flex items-center gap-1.5 min-w-0">
      {icon}
      <span className="truncate">{label}</span>
    </span>
    <span className="font-mono text-zinc-900 shrink-0">{value}</span>
  </div>
);

export default CompareStratigraphiesDialog;
