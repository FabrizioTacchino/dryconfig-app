import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Flame, Volume2, Thermometer, Weight, Ruler, Wrench, BookOpen, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { LayerV2, StratigraphyTypology } from '../../types';
import { buildWallSectionModel } from '../section-view/wallModel';
import { exportTechnicalSheetPDF } from './exportTechnicalSheetPDF';

interface TechnicalSheetProps {
  layers: LayerV2[];
  studSpacingMm: 300 | 400 | 600;
  systemCode?: string;
  typology: StratigraphyTypology;
  wallThicknessMm: number;
  /** Nome stratigrafia (per export PDF). */
  stratigraphyName?: string;
  /** Descrizione stratigrafia (per export PDF). */
  stratigraphyDescription?: string;
  /** Costo €/m² totale calcolato (per export PDF). */
  totalCostPerSqm?: number;
}

/**
 * Tab Tecnico: scheda tecnica formale stile catalogo Knauf.
 *
 * Sezioni:
 *  - Header (nome, codice sistema, tipologia)
 *  - Prestazioni aggregate (EI, Rw, λ, peso)
 *  - Tabella stratigrafia (strato per strato)
 *  - Composizione struttura (passo, montanti, isolante, viti)
 *  - Voce di capitolato (testo riusabile per i preventivi)
 *  - Norme di riferimento
 */
const TechnicalSheet: React.FC<TechnicalSheetProps> = ({
  layers,
  studSpacingMm,
  systemCode,
  typology,
  wallThicknessMm,
  stratigraphyName,
  stratigraphyDescription,
  totalCostPerSqm = 0,
}) => {
  const model = useMemo(() => buildWallSectionModel(layers), [layers]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // Cerca l'SVG della sezione tecnica (tab Sezione) per inserirlo nel PDF.
      // Nota: la sezione potrebbe non essere montata se l'utente è fermo sul tab Tecnico
      // → in quel caso il PDF si genera senza immagine sezione.
      const sectionSvg = document.querySelector<SVGSVGElement>(
        '[data-radix-tabs-content][data-state="active"] svg, .technical-wall-svg, [data-section-view] svg',
      );
      await exportTechnicalSheetPDF({
        layers,
        studSpacingMm,
        systemCode,
        typology,
        wallThicknessMm,
        totalWeightKgSqm: totalWeight,
        totalCostPerSqm,
        bestRwDb: bestRw,
        fireClasses,
        avgLambda,
        stratigraphyName: stratigraphyName ?? 'Stratigrafia',
        stratigraphyDescription,
        sectionSvgElement: sectionSvg,
      });
      toast.success('PDF scaricato.');
    } catch (err) {
      console.error('[TechnicalSheet] export PDF error:', err);
      toast.error('Errore durante la generazione del PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (layers.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
        <div>
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p>Aggiungi materiali per generare la scheda tecnica</p>
        </div>
      </Card>
    );
  }

  // ===== Aggregati prestazioni =====
  const totalWeight = layers.reduce((acc, l) => {
    const w = Number(l.material?.weight_per_sqm ?? 0);
    return acc + (Number.isFinite(w) ? w : 0);
  }, 0);

  // λ medio pesato sullo spessore degli isolanti / lastre con λ
  const lambdaLayers = layers.filter(l => Number(l.material?.thermal_conductivity ?? 0) > 0);
  const avgLambda = lambdaLayers.length > 0
    ? lambdaLayers.reduce((acc, l) => {
        const lam = Number(l.material?.thermal_conductivity ?? 0);
        const t = Number(l.thickness ?? l.material?.thickness ?? 0);
        return acc + lam * t;
      }, 0) / lambdaLayers.reduce((acc, l) => acc + Number(l.thickness ?? l.material?.thickness ?? 0), 0)
    : null;

  // Rw migliore singolo layer (placeholder finché non c'è calcolo aggregato)
  const bestRw = layers.reduce((acc, l) => {
    const r = Number(l.material?.acoustic_performance ?? 0);
    return r > acc ? r : acc;
  }, 0);

  // Fire class: prendi la più severa fra le lastre (EI viene da test, qui best effort)
  const fireClasses = Array.from(new Set(
    layers
      .map(l => l.material?.fire_class)
      .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
  ));

  // ===== Conteggi =====
  const boards = layers.filter(l => l.material?.category === 'board');
  const structures = layers.filter(l => l.material?.category === 'structure_frame');
  const guides = layers.filter(l => l.material?.category === 'structure_guide');
  const insulations = layers.filter(l => l.material?.category === 'insulation');
  const screwsLayers = layers.filter(l => l.screwMaterial && (l.screwQuantity ?? 0) > 0);

  // ===== Voce di capitolato (testo riusabile) =====
  const tipologyLabel: Record<StratigraphyTypology, string> = {
    partition: 'parete divisoria interna a secco',
    lining: 'controparete a secco',
    ceiling: 'controsoffitto a secco',
    unknown: 'sistema a secco',
  };

  const capitolato = (() => {
    const parts: string[] = [];
    parts.push(
      `Realizzazione di ${tipologyLabel[typology]} costituita da:`
    );
    if (structures.length > 0) {
      const struct = structures[0].material;
      parts.push(
        ` - struttura metallica con profili a C in acciaio zincato larghezza ${struct?.width ?? '—'}mm` +
        (struct?.sheet_thickness ? ` (lamiera ${struct.sheet_thickness}mm)` : '') +
        `, posati ad interasse ${studSpacingMm}mm;`
      );
    }
    if (guides.length > 0) {
      const guide = guides[0].material;
      parts.push(
        ` - guide perimetrali a U in acciaio zincato larghezza ${guide?.width ?? '—'}mm` +
        (guide?.sheet_thickness ? ` (lamiera ${guide.sheet_thickness}mm)` : '') +
        `, fissate a pavimento e soffitto;`
      );
    }
    if (insulations.length > 0) {
      const ins = insulations[0].material;
      const t = insulations[0].thickness ?? ins?.thickness ?? 0;
      parts.push(
        ` - materassino isolante in ${ins?.material_type ?? 'fibra minerale'}` +
        ` spessore ${t}mm` +
        (ins?.thermal_conductivity ? ` (λ=${ins.thermal_conductivity} W/mK)` : '') +
        `, alloggiato nel vano dei profili;`
      );
    }
    if (boards.length > 0) {
      const boardCount = boards.length;
      const firstBoard = boards[0].material;
      parts.push(
        ` - rivestimento in n.${boardCount} lastre di ${firstBoard?.material_type ?? 'cartongesso'}` +
        ` spessore ${firstBoard?.thickness ?? '12,5'}mm` +
        (firstBoard?.en_520_type ? ` tipo ${firstBoard.en_520_type} (UNI EN 520)` : '') +
        `;`
      );
    }
    if (screwsLayers.length > 0) {
      parts.push(
        ` - fissaggio delle lastre con viti autofilettanti per cartongesso, interasse conforme a UNI 11424:2015.`
      );
    }
    parts.push(
      ` Lo spessore complessivo del sistema è di ${wallThicknessMm.toFixed(0)}mm.`
    );
    return parts.join('').trim();
  })();

  // ===== Render =====
  return (
    <Card className="p-0 overflow-hidden bg-white">
      {/* === HEADER stile catalogo === */}
      <div className="px-6 py-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1">
              Scheda tecnica · DryConfig
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {systemCode ?? 'DC-CUSTOM'}
            </h2>
            <p className="text-sm text-zinc-300 mt-1">
              {typology === 'partition' && 'Parete divisoria interna a secco'}
              {typology === 'lining' && 'Controparete a secco'}
              {typology === 'ceiling' && 'Controsoffitto a secco'}
              {typology === 'unknown' && 'Sistema a secco personalizzato'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportPdf}
              disabled={isExporting || layers.length === 0}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Download className="h-4 w-4 mr-1.5" />
              {isExporting ? 'Esporto…' : 'Esporta PDF'}
            </Button>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400">Spessore totale</div>
              <div className="text-3xl font-bold font-mono">{wallThicknessMm.toFixed(0)}</div>
              <div className="text-[10px] text-zinc-400">mm</div>
            </div>
          </div>
        </div>
      </div>

      {/* === PRESTAZIONI (4 grandi metriche) === */}
      <div className="grid grid-cols-4 divide-x border-b">
        <PerformanceCell
          icon={<Flame className="h-4 w-4 text-orange-600" />}
          label="Resistenza al fuoco"
          value={fireClasses.length > 0 ? fireClasses.join(' / ') : '—'}
          unit="EI / classe"
          accent="orange"
        />
        <PerformanceCell
          icon={<Volume2 className="h-4 w-4 text-blue-600" />}
          label="Isolamento acustico"
          value={bestRw > 0 ? bestRw.toFixed(0) : '—'}
          unit="Rw dB"
          accent="blue"
        />
        <PerformanceCell
          icon={<Thermometer className="h-4 w-4 text-emerald-600" />}
          label="Cond. termica media"
          value={avgLambda !== null ? avgLambda.toFixed(3) : '—'}
          unit="λ W/mK"
          accent="emerald"
        />
        <PerformanceCell
          icon={<Weight className="h-4 w-4 text-zinc-700" />}
          label="Peso specifico"
          value={totalWeight > 0 ? totalWeight.toFixed(1) : '—'}
          unit="kg/m²"
          accent="zinc"
        />
      </div>

      {/* === STRATIGRAFIA: tabella formale === */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="h-4 w-4 text-zinc-700" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
            Stratigrafia (lato A → lato B)
          </h3>
        </div>
        <div className="overflow-hidden border border-zinc-200 rounded-md">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left w-10">N°</th>
                <th className="px-3 py-2 text-left">Materiale</th>
                <th className="px-3 py-2 text-left">Categoria</th>
                <th className="px-3 py-2 text-right">Spessore</th>
                <th className="px-3 py-2 text-right">Peso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {layers.map((l, idx) => {
                const m = l.material;
                if (!m) {
                  return (
                    <tr key={l.id} className="text-zinc-400 italic">
                      <td className="px-3 py-2 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2" colSpan={4}>(layer vuoto)</td>
                    </tr>
                  );
                }
                const t = l.thickness ?? m.thickness ?? 0;
                const w = m.weight_per_sqm;
                return (
                  <tr key={l.id} className="hover:bg-zinc-50/50">
                    <td className="px-3 py-2 font-mono text-zinc-500">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-zinc-900">{m.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {m.supplier ?? '—'}{m.code ? ` · ${m.code}` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <CategoryBadge category={m.category} />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-700">
                      {t > 0 ? `${Number(t).toFixed(1)} mm` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-700">
                      {w ? `${Number(w).toFixed(2)} kg/m²` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-50 font-semibold">
              <tr>
                <td className="px-3 py-2" colSpan={3}>Totale</td>
                <td className="px-3 py-2 text-right font-mono text-zinc-900">
                  {wallThicknessMm.toFixed(1)} mm
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-900">
                  {totalWeight.toFixed(2)} kg/m²
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* === COMPOSIZIONE STRUTTURA === */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-zinc-700" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
            Composizione struttura
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <SpecRow label="Tipologia" value={typology} />
          <SpecRow label="Interasse montanti" value={`${studSpacingMm} mm`} />
          <SpecRow label="N. lastre" value={`${boards.length}`} />
          <SpecRow label="N. montanti" value={`${structures.length}`} />
          <SpecRow label="N. guide" value={`${guides.length}`} />
          <SpecRow label="N. isolanti" value={`${insulations.length}`} />
          {screwsLayers.length > 0 && (
            <SpecRow
              label="Viti per fissaggio"
              value={`${screwsLayers.length} layer · ${screwsLayers.reduce((acc, l) => acc + (l.screwQuantity ?? 0), 0).toFixed(0)} pz/m²`}
            />
          )}
          <SpecRow label="N. blocchi sezione" value={`${model.blocks.length}`} />
        </div>
      </div>

      {/* === VOCE DI CAPITOLATO === */}
      <div className="px-6 py-5 border-b bg-zinc-50/50">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-zinc-700" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
            Voce di capitolato
          </h3>
        </div>
        <div className="text-xs leading-relaxed text-zinc-700 bg-white border border-zinc-200 rounded-md p-4 font-serif">
          {capitolato}
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 italic">
          Testo generato automaticamente · da rivedere e adattare alle specifiche del cantiere prima dell'inserimento in capitolato.
        </p>
      </div>

      {/* === NORME DI RIFERIMENTO === */}
      <div className="px-6 py-4">
        <h3 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
          Norme di riferimento
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-600">
          <div>· UNI 11424:2015 — Sistemi a secco con lastre di gesso rivestito</div>
          <div>· UNI EN 520 — Lastre di gesso rivestito (tipi e proprietà)</div>
          <div>· UNI EN 13501-1 — Classificazione di reazione al fuoco</div>
          <div>· UNI EN ISO 717-1 — Valutazione isolamento acustico</div>
          <div>· UNI EN 14195 — Profili metallici per sistemi a secco</div>
          <div>· UNI EN 13162 — Prodotti isolanti in lana minerale</div>
        </div>
      </div>

      {/* === FOOTER === */}
      <div className="px-6 py-3 bg-zinc-50 border-t text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Documento generato da DryConfig</span>
        <span className="font-mono">{new Date().toLocaleDateString('it-IT')}</span>
      </div>
    </Card>
  );
};

// ===== Sub-componenti =====

interface PerformanceCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  accent: 'orange' | 'blue' | 'emerald' | 'zinc';
}

const PerformanceCell: React.FC<PerformanceCellProps> = ({ icon, label, value, unit }) => (
  <div className="px-4 py-4 text-center">
    <div className="flex items-center justify-center gap-1 mb-1">
      {icon}
      <span className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
    </div>
    <div className="text-2xl font-bold font-mono text-zinc-900">{value}</div>
    <div className="text-[10px] text-zinc-500">{unit}</div>
  </div>
);

const SpecRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-baseline border-b border-zinc-100 py-1">
    <span className="text-zinc-500">{label}</span>
    <span className="font-mono font-medium text-zinc-900">{value}</span>
  </div>
);

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const map: Record<string, { label: string; cls: string }> = {
    board: { label: 'Lastra', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    structure_frame: { label: 'Montante', cls: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
    structure_guide: { label: 'Guida', cls: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
    insulation: { label: 'Isolante', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    screw: { label: 'Vite', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    finish: { label: 'Finitura', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
    ceiling_tile: { label: 'Pannello', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  };
  const conf = map[category] ?? { label: category, cls: 'bg-zinc-100 text-zinc-700 border-zinc-300' };
  return (
    <Badge variant="outline" className={`${conf.cls} text-[10px] font-medium px-1.5 py-0`}>
      {conf.label}
    </Badge>
  );
};

export default TechnicalSheet;
