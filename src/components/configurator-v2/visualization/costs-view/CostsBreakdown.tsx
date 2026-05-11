import React from 'react';
import { Card } from '@/components/ui/card';
import { Receipt, TrendingDown, Clock, Wrench, Layers, Hammer } from 'lucide-react';
import type { LayerV2 } from '../../types';
import { useStratigraphyCosts } from '../../hooks/useStratigraphyCosts';

interface CostsBreakdownProps {
  layers: LayerV2[];
  studSpacingMm: 300 | 400 | 600;
}

/**
 * Tab Costi: breakdown stile fattura del costo €/m² della stratigrafia.
 *
 * Per ogni materiale mostra: quantità · €/unit · costo riga · minuti posa.
 * Le viti sono in sezione dedicata, ognuna con tempo posa di fissaggio.
 * Il totale manodopera è la somma di tutti i minuti × cost_per_hour / 60.
 */
const CostsBreakdown: React.FC<CostsBreakdownProps> = ({ layers, studSpacingMm }) => {
  const { breakdown, costPerHour, isLoading } = useStratigraphyCosts(layers, studSpacingMm);

  if (layers.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
        <div>
          <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p>Aggiungi materiali per vedere il breakdown costi</p>
        </div>
      </Card>
    );
  }

  const fmtEur = (v: number) => `€${v.toFixed(2)}`;
  const fmtMin = (v: number) => v < 1 ? `${(v * 60).toFixed(0)}s` : `${v.toFixed(1)}'`;
  const fmtQty = (v: number, unit: string) => {
    if (unit === 'mq') return `${v.toFixed(2)} m²`;
    if (unit === 'ml') return `${v.toFixed(2)} ml`;
    if (unit === 'pz') return `${v.toFixed(0)} pz`;
    return `${v.toFixed(2)} ${unit}`;
  };

  const categoryIcon = (cat: string) => {
    if (cat === 'board' || cat === 'ceiling_tile') return <Layers className="h-3.5 w-3.5 text-amber-600" />;
    if (cat === 'structure_frame' || cat === 'structure_guide') return <Wrench className="h-3.5 w-3.5 text-zinc-500" />;
    if (cat === 'insulation') return <Layers className="h-3.5 w-3.5 text-yellow-600" />;
    return <Layers className="h-3.5 w-3.5 text-zinc-400" />;
  };

  return (
    <Card className="p-0 overflow-hidden">
      {/* === HEADER con totale generale === */}
      <div className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-b">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Riepilogo costi al m²</div>
          <div className="text-[10px] text-muted-foreground/70 mt-0.5">
            Prezzi netti per la tua organizzazione (sconti già applicati)
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-zinc-900 font-mono">{fmtEur(breakdown.totalCost)}</div>
          <div className="text-[10px] text-muted-foreground">€/m² totale</div>
        </div>
      </div>

      {/* === SEZIONE MATERIALI === */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
          <Layers className="h-3 w-3" />
          Materiali
        </div>
        {/* Header colonne */}
        <div className="grid grid-cols-12 gap-2 text-[9px] uppercase tracking-wider text-muted-foreground/60 pb-1.5 border-b border-zinc-100 mb-1.5">
          <div className="col-span-6">Materiale</div>
          <div className="col-span-2 text-right">Quantità</div>
          <div className="col-span-1 text-right">€/u</div>
          <div className="col-span-1 text-right" title="Tempo posa">⏱</div>
          <div className="col-span-2 text-right">Costo</div>
        </div>
        <div className="space-y-1.5">
          {breakdown.rows.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-2">Nessun materiale assegnato.</div>
          ) : (
            breakdown.rows.map((row) => (
              <div key={row.layerIdx} className="grid grid-cols-12 gap-2 items-baseline text-xs">
                <div className="col-span-6 flex items-baseline gap-1.5 min-w-0">
                  <span className="font-mono text-muted-foreground shrink-0">#{row.layerNum}</span>
                  <span className="shrink-0">{categoryIcon(row.category)}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-800 truncate">{row.name}</div>
                    {row.notes && <div className="text-[10px] text-muted-foreground/80">{row.notes}</div>}
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono text-muted-foreground">
                  {fmtQty(row.quantity, row.unit)}
                </div>
                <div className="col-span-1 text-right font-mono text-muted-foreground">
                  {fmtEur(row.unitPriceNet)}
                </div>
                <div className="col-span-1 text-right font-mono text-blue-700/80">
                  {row.rowMinutes > 0 ? fmtMin(row.rowMinutes) : '—'}
                </div>
                <div className="col-span-2 text-right font-mono font-semibold text-zinc-900">
                  {fmtEur(row.rowCost)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between items-baseline mt-3 pt-2 border-t border-zinc-100 text-xs">
          <span className="text-muted-foreground">Subtotale materiali</span>
          <span className="font-mono font-semibold text-zinc-900">{fmtEur(breakdown.subtotalMaterials)}</span>
        </div>
      </div>

      {/* === SEZIONE VITI (una riga per layer fissato) === */}
      {(breakdown.screwRows.length > 0 || breakdown.subtotalScrews > 0) && (
        <div className="px-5 py-3 border-t">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            <Hammer className="h-3 w-3" />
            Viti
          </div>
          {breakdown.screwRows.length > 0 ? (
            <div className="space-y-1.5">
              {breakdown.screwRows.map((sr, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-baseline text-xs">
                  <div className="col-span-6 flex items-baseline gap-1.5 min-w-0">
                    <span className="font-mono text-muted-foreground shrink-0">#{sr.layerNum}</span>
                    <Hammer className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-800 truncate">{sr.screwName}</div>
                      <div className="text-[10px] text-muted-foreground/80">
                        {sr.screwQuantityPerSqm.toFixed(1)} pz/m² · 5s/vite
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-mono text-muted-foreground">
                    {sr.screwQuantityPerSqm.toFixed(0)} pz
                  </div>
                  <div className="col-span-1 text-right font-mono text-muted-foreground">
                    €{sr.pricePerPiece.toFixed(3)}
                  </div>
                  <div className="col-span-1 text-right font-mono text-blue-700/80">
                    {fmtMin(sr.rowMinutes)}
                  </div>
                  <div className="col-span-2 text-right font-mono font-semibold text-zinc-900">
                    {fmtEur(sr.rowCost)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-zinc-700">Fissaggio lastre (UNI 11424:2015)</span>
              <span className="font-mono font-semibold text-zinc-900">{fmtEur(breakdown.subtotalScrews)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-zinc-100 text-xs">
            <span className="text-muted-foreground">Subtotale viti</span>
            <span className="font-mono font-semibold text-zinc-900">{fmtEur(breakdown.subtotalScrews)}</span>
          </div>
        </div>
      )}

      {/* === MANODOPERA: somma di TUTTI i minuti dei materiali e viti === */}
      {breakdown.laborMinutes > 0 && (
        <div className="px-5 py-3 border-t bg-blue-50/30">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-blue-900/70 mb-2">
            <Clock className="h-3 w-3" />
            Manodopera
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-700">
                Tempo posa totale (somma minuti riga per riga)
              </span>
              <span className="font-mono font-semibold text-blue-900">
                {breakdown.laborMinutes.toFixed(1)} min
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">
                = <span className="font-mono">{breakdown.laborTime.toFixed(3)} h/m²</span> × {fmtEur(costPerHour)}/h
              </span>
              <span className="font-mono font-semibold text-zinc-900">{fmtEur(breakdown.laborCost)}</span>
            </div>
          </div>
        </div>
      )}

      {/* === TOTALE === */}
      <div className="px-5 py-4 border-t-2 border-zinc-200 bg-zinc-50">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold uppercase tracking-wide">Totale</span>
          <span className="text-2xl font-bold font-mono text-zinc-900">{fmtEur(breakdown.totalCost)}</span>
        </div>
        <div className="text-[10px] text-muted-foreground text-right mt-0.5">€/m² IVA esclusa</div>
      </div>

      {/* === RISPARMIO APPLICATO === */}
      {breakdown.totalSavings > 0.01 && (
        <div className="px-5 py-3 bg-emerald-50/70 border-t border-emerald-200/50 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-emerald-700 shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-semibold text-emerald-900">Risparmio sconti applicati: </span>
            <span className="font-mono font-bold text-emerald-700">{fmtEur(breakdown.totalSavings)}/m²</span>
            <div className="text-[10px] text-emerald-700/80 mt-0.5">
              Differenza tra prezzo di listino e prezzo netto della tua organizzazione.
            </div>
          </div>
        </div>
      )}

      {/* === LOADING === */}
      {isLoading && (
        <div className="px-5 py-2 text-[10px] text-muted-foreground italic border-t">
          Caricamento costo orario manodopera…
        </div>
      )}
    </Card>
  );
};

export default CostsBreakdown;
