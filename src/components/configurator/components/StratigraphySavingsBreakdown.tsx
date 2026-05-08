import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

interface LayerLike {
  material_cost_per_sqm?: number | null;
  materials?: { list_price?: number | null; unit_price?: number | null } | null;
  material?:  { list_price?: number | null; unit_price?: number | null } | null;
}

interface StratigraphySavingsBreakdownProps {
  layers: LayerLike[];
  /** Optional override (es. dal DB su stratigraphies.material_cost_per_sqm). */
  netMaterialCostPerSqm?: number | null;
  /** Optional area in mq. Se passata, mostra anche il risparmio assoluto sul muro. */
  area?: number | null;
  className?: string;
  variant?: 'card' | 'inline';
}

/**
 * Mostra "Listino vs Netto · Risparmio" per i materiali di una stratigrafia.
 * Calcola scalando il costo netto del layer per il rapporto list_price/unit_price.
 */
export const StratigraphySavingsBreakdown: React.FC<StratigraphySavingsBreakdownProps> = ({
  layers,
  netMaterialCostPerSqm,
  area,
  className = '',
  variant = 'card',
}) => {
  // Net (con sconto): preferisci il valore aggregato dal DB se passato; altrimenti somma dai layer.
  const netPerSqm = (netMaterialCostPerSqm ?? null) !== null
    ? Number(netMaterialCostPerSqm)
    : layers.reduce((sum, l) => sum + (l.material_cost_per_sqm ?? 0), 0);

  // List price equivalente: per ogni layer scala col rapporto list/unit
  let listPerSqm = 0;
  for (const l of layers) {
    const cost = l.material_cost_per_sqm ?? 0;
    const m = l.materials || l.material;
    const lp = m?.list_price ?? null;
    const up = m?.unit_price ?? null;
    if (lp != null && up != null && up > 0) {
      listPerSqm += cost * (lp / up);
    } else {
      // se manca info, assumiamo niente sconto su questo layer
      listPerSqm += cost;
    }
  }

  const savedPerSqm = listPerSqm - netPerSqm;
  const savedPct = listPerSqm > 0 ? (savedPerSqm / listPerSqm) * 100 : 0;
  const hasSavings = savedPerSqm > 0.005;

  const totalNet = (area ?? 0) > 0 ? netPerSqm * (area as number) : null;
  const totalList = (area ?? 0) > 0 ? listPerSqm * (area as number) : null;
  const totalSaved = totalNet != null && totalList != null ? totalList - totalNet : null;

  if (!hasSavings && netPerSqm < 0.001) return null;

  if (variant === 'inline') {
    return (
      <div className={`flex items-center flex-wrap gap-x-3 gap-y-1 text-xs ${className}`}>
        <span className="text-muted-foreground">Materiali:</span>
        <span className="line-through text-muted-foreground">€{listPerSqm.toFixed(2)}/m²</span>
        <span className="font-semibold text-green-700">€{netPerSqm.toFixed(2)}/m²</span>
        {hasSavings && (
          <span className="inline-flex items-center gap-0.5 text-green-700 font-medium">
            <TrendingDown className="h-3 w-3" />−{savedPct.toFixed(1)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 ${className}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Costo materiali (per m²)</span>
          {hasSavings && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
              <TrendingDown className="h-3.5 w-3.5" />
              {savedPct.toFixed(1)}% di sconto
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 items-end">
          <Stat label="Listino" value={`€${listPerSqm.toFixed(2)}`} muted />
          <Stat label="Netto" value={`€${netPerSqm.toFixed(2)}`} accent />
          <Stat label="Risparmio" value={`€${savedPerSqm.toFixed(2)}`} accent />
        </div>
        {totalNet != null && totalList != null && totalSaved != null && totalSaved > 0.5 && (
          <div className="pt-2 border-t border-green-200/60 text-[11px] flex items-center justify-between">
            <span className="text-muted-foreground">Per la superficie indicata ({area} m²):</span>
            <span>
              Listino <span className="line-through">€{totalList.toFixed(2)}</span> →{' '}
              <span className="font-semibold text-green-700">€{totalNet.toFixed(2)}</span>{' '}
              <span className="text-green-700">(risparmi €{totalSaved.toFixed(2)})</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Stat: React.FC<{ label: string; value: string; muted?: boolean; accent?: boolean }> = ({
  label, value, muted = false, accent = false,
}) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-base font-bold ${accent ? 'text-green-700' : muted ? 'line-through text-muted-foreground' : ''}`}>
      {value}
    </div>
  </div>
);

export default StratigraphySavingsBreakdown;
