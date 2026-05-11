import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ShieldCheck, User, Flame, Volume2, Weight, ArrowRight, MoreVertical, Trash2, FolderOpen, FilePlus2 } from 'lucide-react';
import type { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';
import type { LayerV2 } from '../types';
import { buildWallSectionModel } from '../visualization/section-view/wallModel';
import MiniSectionPreview from './MiniSectionPreview';
import DeleteStratigraphyDialog from './DeleteStratigraphyDialog';
import AddToEstimateDialogV2 from '../estimates/AddToEstimateDialogV2';

interface StratigraphyCardV2Props {
  stratigraphy: UnifiedStratigraphy;
  onClick: () => void;
}

/**
 * Card singola della lista stratigrafie V2.
 *
 * Layout fisso a 4 fasce orizzontali (NON dipende dalla presenza di description):
 *   1. Header  : nome (1 riga truncate) + badge certificata/custom
 *   2. Preview : MiniSectionPreview SVG con altezza fissa h-24
 *   3. Metriche: 4 box (EI · Rw · Peso · Spessore)
 *   4. Footer  : costo €/m² + CTA "Apri"
 *
 * La description NON appare nella card (era la causa di disallineamento delle
 * thumbnail). Resta disponibile come tooltip sul nome (`title` attribute).
 */
const StratigraphyCardV2: React.FC<StratigraphyCardV2Props> = ({ stratigraphy: s, onClick }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEstimateDialog, setShowEstimateDialog] = useState(false);
  const layers = (s.layers ?? []) as unknown as LayerV2[];
  // Spessore calcolato con la STESSA logica della sezione tecnica del configuratore:
  // l'isolante DENTRO la struttura non somma — il valore raw `s.total_thickness`
  // dal DB invece sommava tutto e gonfiava (185mm vs 125mm reali).
  const wallThicknessMm = useMemo(() => {
    const ordered = [...layers].sort(
      (a: any, b: any) => Number(a?.position ?? 0) - Number(b?.position ?? 0),
    );
    return buildWallSectionModel(ordered).totalThicknessMm;
  }, [layers]);
  const totalThickness = wallThicknessMm > 0
    ? wallThicknessMm
    : (s.total_thickness ?? 0);
  const cost = s.comprehensive_cost_per_sqm ?? s.cost_per_sqm ?? 0;
  const isCertified = !!s.is_certified;

  return (
    <>
    <Card
      onClick={onClick}
      className="group flex flex-col p-3 cursor-pointer hover:border-primary hover:shadow-md transition-all bg-white"
    >
      {/* === 1. HEADER (altezza fissa: 1 riga nome + badge + menu) === */}
      <div className="flex items-start justify-between gap-2 h-7 mb-2">
        <h3
          className="text-sm font-semibold text-zinc-900 truncate flex-1 min-w-0 leading-7"
          title={s.description ? `${s.name} — ${s.description}` : s.name}
        >
          {s.name}
        </h3>
        <Badge
          variant="outline"
          className={
            isCertified
              ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px] shrink-0 leading-none py-1'
              : 'bg-zinc-50 text-zinc-600 border-zinc-200 text-[10px] shrink-0 leading-none py-1'
          }
        >
          {isCertified ? (
            <><ShieldCheck className="h-3 w-3 mr-1" /> Certificata</>
          ) : (
            <><User className="h-3 w-3 mr-1" /> Custom</>
          )}
        </Badge>
        {/* Menu 3-dots: action sulla card senza aprire la stratigrafia */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1 -mt-0.5 shrink-0 opacity-60 hover:opacity-100"
              aria-label="Altre azioni"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="w-52">
            <DropdownMenuItem onClick={() => onClick()}>
              <FolderOpen className="h-3.5 w-3.5 mr-2" />
              Apri
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowEstimateDialog(true);
              }}
            >
              <FilePlus2 className="h-3.5 w-3.5 mr-2" />
              Aggiungi a preventivo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* === 2. PREVIEW SEZIONE (altezza fissa) === */}
      <div className="h-24 w-full mb-2 rounded overflow-hidden border border-zinc-200 bg-white flex items-center justify-center">
        <MiniSectionPreview layers={layers} className="w-full h-full" />
      </div>

      {/* === 3. METRICHE (altezza fissa) === */}
      <div className="grid grid-cols-4 gap-1 text-center mb-2">
        <Metric
          icon={<Flame className="h-3 w-3 text-orange-600" />}
          label="EI"
          value={s.fire_resistance_class || '—'}
        />
        <Metric
          icon={<Volume2 className="h-3 w-3 text-blue-600" />}
          label="Rw"
          value={s.acoustic_performance ? `${Math.round(Number(s.acoustic_performance))}` : '—'}
          unit="dB"
        />
        <Metric
          icon={<Weight className="h-3 w-3 text-zinc-600" />}
          label="Peso"
          value={s.weight_per_sqm ? Number(s.weight_per_sqm).toFixed(0) : '—'}
          unit="kg"
        />
        <Metric
          icon={null}
          label="Spess."
          value={`${Number(totalThickness).toFixed(0)}`}
          unit="mm"
        />
      </div>

      {/* === 4. FOOTER (mt-auto: si attacca in fondo) === */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t text-xs">
        <span className="font-mono font-bold text-zinc-900">
          {cost > 0 ? `€${cost.toFixed(2)}` : '—'}
          <span className="font-normal text-zinc-500 text-[10px]"> /m²</span>
        </span>
        <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium">
          Apri <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Card>

    <DeleteStratigraphyDialog
      open={showDeleteDialog}
      onOpenChange={setShowDeleteDialog}
      stratigraphyId={s.id}
      stratigraphyName={s.name}
    />

    <AddToEstimateDialogV2
      open={showEstimateDialog}
      onOpenChange={setShowEstimateDialog}
      stratigraphyId={s.id}
      stratigraphyName={s.name}
      stratigraphyDescription={s.description ?? undefined}
      costPerSqm={cost}
    />
    </>
  );
};

const Metric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}> = ({ icon, label, value, unit }) => (
  <div className="flex flex-col items-center justify-center bg-zinc-50/60 rounded px-1 py-1 min-w-0">
    <div className="flex items-center gap-0.5 text-[9px] uppercase tracking-wider text-zinc-500 leading-none">
      {icon}
      {label}
    </div>
    <div className="text-xs font-semibold text-zinc-800 font-mono mt-0.5 truncate max-w-full">
      {value}
      {unit && <span className="text-[9px] text-zinc-500 font-normal ml-0.5">{unit}</span>}
    </div>
  </div>
);

export default StratigraphyCardV2;
