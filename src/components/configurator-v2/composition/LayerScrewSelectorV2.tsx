import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wrench, Info, RefreshCw, AlertTriangle, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DatabaseMaterial } from '@/hooks/useMaterials';
import type { LayerV2 } from '../types';
import type { ScrewSuggestion } from '../hooks/screwRecommendation';
import { getScrewPricePerPiece } from '@/utils/screwPricing';

interface LayerScrewSelectorV2Props {
  layer: LayerV2;
  suggestion?: ScrewSuggestion;
  /** Override manuale della vite (disattiva auto-suggest). */
  onChangeScrew: (screw: DatabaseMaterial | null) => void;
  /** Override manuale della quantità (disattiva auto-suggest). */
  onChangeQuantity: (qty: number) => void;
  /** Riattiva l'auto-suggest e applica la vite raccomandata. */
  onReapplySuggestion: () => void;
}

/**
 * Selettore vite associato a un layer board del configuratore V2.
 *
 * Mostra:
 *  - Riga compatta con vite corrente, lunghezza, costo €/m²
 *  - Tooltip motivazione (lato + ruolo + lunghezza minima UNI 11424)
 *  - Bottone "Cambia" → popover con dropdown raggruppato (Consigliata · Compatibili · Tutte)
 *  - Input quantità inline
 *  - Warning se la vite scelta è troppo corta vs requiredLength
 *  - Bottone "Riapplica suggerimento" se l'utente ha fatto override manuale
 */
const LayerScrewSelectorV2: React.FC<LayerScrewSelectorV2Props> = ({
  layer,
  suggestion,
  onChangeScrew,
  onChangeQuantity,
  onReapplySuggestion,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const currentScrew = layer.screwMaterial ?? suggestion?.recommended ?? null;
  const currentQty = Number(layer.screwQuantity ?? suggestion?.screwsPerSqm ?? 0);
  const cost = Number(layer.screwCostPerSqm ?? 0);
  const isOverride = layer.screwIsAutoSuggested === false;

  const requiredLength = suggestion?.requiredLengthMm ?? 0;
  const currentLength = Number(currentScrew?.length ?? currentScrew?.thickness ?? 0);
  const isLengthOk = !suggestion || currentLength + 0.001 >= requiredLength;
  const pricePerPiece = getScrewPricePerPiece(currentScrew);

  // Stato vuoto: niente raccomandazioni disponibili (es. regole non caricate)
  if (!suggestion && !currentScrew) {
    return null;
  }

  return (
    <div
      className={cn(
        'mt-2 px-3 py-2 rounded border bg-white/60',
        isOverride ? 'border-amber-300/80 bg-amber-50/30' : 'border-zinc-200',
      )}
    >
      <div className="flex items-center gap-2 flex-wrap text-[11px]">
        <Wrench className={cn('h-3.5 w-3.5 shrink-0', isOverride ? 'text-amber-700' : 'text-zinc-600')} />

        {/* Nome vite + lunghezza */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {currentScrew ? (
            <>
              <span className="font-medium text-zinc-800 truncate" title={currentScrew.name}>
                {currentScrew.name}
              </span>
              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 shrink-0">
                {currentLength}mm
              </Badge>
              {suggestion?.pickSource === 'org_preference' && !isOverride && (
                <Badge className="text-[9px] px-1 py-0 shrink-0 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                  ✨ tua preferenza
                </Badge>
              )}
            </>
          ) : (
            <span className="text-amber-700 italic">Nessuna vite assegnata</span>
          )}

          {suggestion && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-zinc-400 hover:text-zinc-700 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-[11px]">
                  <div className="font-semibold mb-0.5">Perché questa vite</div>
                  <div className="text-zinc-200">{suggestion.reason}</div>
                  {suggestion.warnings.length > 0 && (
                    <div className="text-amber-300 mt-1">
                      ⚠ {suggestion.warnings.join(', ')}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Quantità */}
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            value={currentQty || ''}
            onChange={(e) => onChangeQuantity(Number(e.target.value) || 0)}
            min="0"
            step="1"
            className="h-6 w-14 text-[11px] px-1.5 py-0"
            aria-label="Numero viti per metro quadro"
          />
          <span className="text-zinc-500">pz/m²</span>
        </div>

        {/* Costo €/m² */}
        <span className="font-mono font-semibold text-zinc-900 shrink-0 ml-1">
          €{cost.toFixed(2)}<span className="text-zinc-500 font-normal">/m²</span>
        </span>

        {/* Bottone Cambia */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
              Cambia
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <ScrewPicker
              suggestion={suggestion}
              currentScrewId={currentScrew?.id ?? null}
              onPick={(s) => {
                onChangeScrew(s);
                setPopoverOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Bottone Riapplica suggerimento */}
        {isOverride && suggestion?.recommended && currentScrew?.id !== suggestion.recommended.id && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-blue-700 hover:bg-blue-50"
            onClick={onReapplySuggestion}
            title="Ripristina la vite consigliata dal sistema"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Riapplica
          </Button>
        )}
      </div>

      {/* Warning vite troppo corta */}
      {currentScrew && !isLengthOk && (
        <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded bg-red-50 border border-red-200 text-[10px] text-red-800">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            Vite di <b>{currentLength}mm</b> insufficiente: serve ≥ <b>{requiredLength}mm</b> per
            {' '}penetrazione 10mm UNI 11424:2015. Considera una vite più lunga.
          </span>
        </div>
      )}

      {/* Warning preferenza org non disponibile (fallback) */}
      {suggestion?.orgPreferenceFallback && (
        <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            La tua vite preferita per questo caso non è più disponibile in catalogo. Sto usando un fallback.{' '}
            <a href="/settings" className="underline font-medium">Aggiorna la preferenza →</a>
          </span>
        </div>
      )}

      {/* Info costo per pezzo */}
      {currentScrew && pricePerPiece > 0 && (
        <div className="text-[9px] text-zinc-500 mt-1 font-mono">
          €{pricePerPiece.toFixed(4)}/pz × {currentQty} = €{cost.toFixed(2)}/m²
          {isOverride && <span className="ml-2 text-amber-700">· override manuale</span>}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Picker (popover content): lista raggruppata di viti
// ============================================================================

interface ScrewPickerProps {
  suggestion?: ScrewSuggestion;
  currentScrewId: string | null;
  onPick: (screw: DatabaseMaterial | null) => void;
}

const ScrewPicker: React.FC<ScrewPickerProps> = ({ suggestion, currentScrewId, onPick }) => {
  if (!suggestion) {
    return (
      <div className="p-3 text-xs text-muted-foreground">
        Nessun catalogo viti disponibile.
      </div>
    );
  }
  const recommended = suggestion.recommended;
  const candidates = suggestion.candidates.filter(s => s.id !== recommended?.id);
  const otherByType = suggestion.byBoardType.filter(
    s => s.id !== recommended?.id && !suggestion.candidates.some(c => c.id === s.id),
  );

  return (
    <div className="max-h-80 overflow-y-auto py-1">
      {recommended && (
        <Section title="Consigliata">
          <ScrewItem
            screw={recommended}
            isSelected={currentScrewId === recommended.id}
            isRecommended
            onClick={() => onPick(recommended)}
          />
        </Section>
      )}

      {candidates.length > 0 && (
        <Section title={`Compatibili (${suggestion.boardCategory})`}>
          {candidates.map(s => (
            <ScrewItem
              key={s.id}
              screw={s}
              isSelected={currentScrewId === s.id}
              onClick={() => onPick(s)}
            />
          ))}
        </Section>
      )}

      {otherByType.length > 0 && (
        <Section title="Stessa categoria, lunghezza non sufficiente">
          {otherByType.map(s => (
            <ScrewItem
              key={s.id}
              screw={s}
              isSelected={currentScrewId === s.id}
              isShort
              onClick={() => onPick(s)}
            />
          ))}
        </Section>
      )}

      {(candidates.length === 0 && otherByType.length === 0 && !recommended) && (
        <div className="p-3 text-xs text-muted-foreground">
          Nessuna vite compatibile in catalogo per <b>{suggestion.boardCategory}</b>.
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="px-1">
    <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">
      {title}
    </div>
    {children}
  </div>
);

const ScrewItem: React.FC<{
  screw: DatabaseMaterial;
  isSelected?: boolean;
  isRecommended?: boolean;
  isShort?: boolean;
  onClick: () => void;
}> = ({ screw, isSelected, isRecommended, isShort, onClick }) => {
  const length = Number(screw.length ?? screw.thickness ?? 0);
  const price = getScrewPricePerPiece(screw);
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-zinc-100 transition-colors',
        isSelected && 'bg-blue-50',
      )}
    >
      <div className="flex items-start gap-1.5 min-w-0 flex-1">
        {isRecommended && <Sparkles className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />}
        {isSelected && !isRecommended && <Check className="h-3 w-3 text-blue-700 mt-0.5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-zinc-900 truncate" title={screw.name}>
            {screw.name}
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <span>{screw.code}</span>
            <span>·</span>
            <span>{length}mm</span>
            {isShort && <span className="text-red-700">· corta!</span>}
          </div>
        </div>
      </div>
      <span className="font-mono text-[10px] text-zinc-700 shrink-0">€{price.toFixed(4)}/pz</span>
    </button>
  );
};

export default LayerScrewSelectorV2;
