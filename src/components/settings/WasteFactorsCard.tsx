import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Percent } from 'lucide-react';
import {
  useWasteFactors,
  useUpdateWasteFactor,
  type WasteCategory,
} from '@/hooks/useWasteFactors';

/**
 * Card Settings → "Sfridi di magazzino". Una riga per categoria materiale.
 * Lo sfrido si applica SOLO al riepilogo materiali da acquistare (RDA),
 * mai al costo unitario del preventivo.
 *
 * Auto-save on blur per evitare un bottone "Salva" globale.
 */
const CATEGORY_LABELS: Record<WasteCategory, string> = {
  board: 'Lastre',
  structure_frame: 'Montanti',
  structure_guide: 'Guide',
  insulation: 'Isolanti',
  screw: 'Viti',
  accessory: 'Accessori',
  finish: 'Finiture (stucco, garza, ecc.)',
  ceiling_tile: 'Pannelli controsoffitto',
  other: 'Altri',
};

const CATEGORY_ORDER: WasteCategory[] = [
  'board',
  'insulation',
  'structure_frame',
  'structure_guide',
  'screw',
  'accessory',
  'finish',
  'ceiling_tile',
  'other',
];

const WasteFactorsCard: React.FC = () => {
  const { wasteMap, isLoading } = useWasteFactors();
  const update = useUpdateWasteFactor();
  const [draft, setDraft] = React.useState<Record<string, string>>({});

  const handleBlur = (category: WasteCategory) => {
    const raw = draft[category];
    if (raw === undefined) return;
    const value = Number(raw.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0 || value > 100) return;
    if (value === wasteMap[category]) {
      // no-op
      setDraft(prev => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
      return;
    }
    update.mutate({ category, percentage: value });
    setDraft(prev => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Sfridi di magazzino
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Percentuale di scarto applicata al <strong>riepilogo materiali da acquistare</strong>.
          Non influisce sul costo unitario del preventivo (basato sul consumo teorico).
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Caricamento sfridi…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {CATEGORY_ORDER.map(cat => {
              const value = draft[cat] ?? String(wasteMap[cat] ?? 0);
              return (
                <div key={cat} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`waste-${cat}`} className="text-sm flex-1 min-w-0">
                    {CATEGORY_LABELS[cat]}
                  </Label>
                  <div className="relative w-24 shrink-0">
                    <Input
                      id={`waste-${cat}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={value}
                      onChange={(e) => setDraft(prev => ({ ...prev, [cat]: e.target.value }))}
                      onBlur={() => handleBlur(cat)}
                      className="pr-7 text-right"
                      disabled={update.isPending}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WasteFactorsCard;
