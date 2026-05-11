import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ruler, Map, Receipt, FileText, Box, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { rasterizeSvg } from './tech-view/exportTechnicalSheetPDF';
import type { LayerV2 } from '../types';
import TechnicalWallDrawing from './section-view/TechnicalWallDrawing';
import CostsBreakdown from './costs-view/CostsBreakdown';
import PlanView from './plan-view/PlanView';
import TechnicalSheet from './tech-view/TechnicalSheet';
import { buildWallSectionModel } from './section-view/wallModel';
import { useSystemCode } from '../hooks/useSystemCode';
import { useTypologyDetection } from '../hooks/useTypologyDetection';

interface VisualizationPanelProps {
  layers: LayerV2[];
  /** Spessore "raw" sommando layer.thickness — informativo, mostrato a parte. */
  totalThicknessMm: number;
  /** Interasse montanti scelto a livello stratigrafia (mm). */
  studSpacingMm: 300 | 400 | 600;
  /** Nome stratigrafia (passato alla scheda Tecnico per export PDF). */
  stratigraphyName?: string;
  /** Descrizione stratigrafia (export PDF). */
  stratigraphyDescription?: string;
  /** Costo €/m² totale calcolato (per export PDF). */
  totalCostPerSqm?: number;
}

/**
 * Pannello destro del configuratore: tab Sezione | Pianta | Costi | Tecnico.
 *
 * V2.0-S3: mostra spessore totale + count layer come placeholder vivo.
 * V2.1: vero preview SVG con pattern, profili C reali, viti, quote.
 *
 * Vedi `docs/mockupui.md` §9-§13.
 */
const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  layers,
  totalThicknessMm,
  studSpacingMm,
  stratigraphyName,
  stratigraphyDescription,
  totalCostPerSqm,
}) => {
  const typology = useTypologyDetection(layers);
  const systemCode = useSystemCode({ typology, layers });

  // Singola fonte di verità per lo spessore parete: il modello "wall section"
  // gestisce correttamente il caso isolante-dentro-vano-del-montante (NON somma).
  // Il prop `totalThicknessMm` è la somma raw dei layer.thickness, che invece
  // gonfierebbe lo spessore quando l'isolante è dentro la struttura.
  const wallThicknessMm = useMemo(() => buildWallSectionModel(layers).totalThicknessMm, [layers]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="section" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="section"><Ruler className="h-4 w-4 mr-1.5" /> Sezione</TabsTrigger>
          <TabsTrigger value="iso"><Box className="h-4 w-4 mr-1.5" /> Vista 3D</TabsTrigger>
          <TabsTrigger value="plan"><Map className="h-4 w-4 mr-1.5" /> Pianta</TabsTrigger>
          <TabsTrigger value="costs"><Receipt className="h-4 w-4 mr-1.5" /> Costi</TabsTrigger>
          <TabsTrigger value="tech"><FileText className="h-4 w-4 mr-1.5" /> Tecnico</TabsTrigger>
        </TabsList>

        <TabsContent value="section" className="mt-4">
          <div className="flex justify-end mb-2">
            <Button
              size="sm"
              variant="outline"
              disabled={layers.length === 0}
              onClick={async () => {
                const svg = document.querySelector<SVGSVGElement>(
                  '[data-section-view] svg.technical-wall-svg, .technical-wall-svg',
                );
                if (!svg) {
                  toast.error('Sezione non trovata.');
                  return;
                }
                const dataUrl = await rasterizeSvg(svg, 2);
                if (!dataUrl) {
                  toast.error('Errore durante la generazione del PNG.');
                  return;
                }
                const a = document.createElement('a');
                const safe = (stratigraphyName ?? 'stratigrafia')
                  .replace(/[^a-z0-9-_ ]/gi, '_')
                  .trim() || 'stratigrafia';
                a.href = dataUrl;
                a.download = `${safe}-sezione.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success('PNG scaricato.');
              }}
            >
              <ImageIcon className="h-4 w-4 mr-1.5" />
              Esporta PNG
            </Button>
          </div>
          <TechnicalWallDrawing
            layers={layers}
            systemCode={layers.length > 0 ? systemCode : undefined}
            studSpacingMm={studSpacingMm}
          />
        </TabsContent>

        <TabsContent value="iso" className="mt-4">
          <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
            <div>
              <Box className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Vista 3D isometrica con render fotorealistico</p>
              <p className="text-xs mt-1">Arriva in Fase V2.4 con motore Three.js dedicato.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanView layers={layers} studSpacingMm={studSpacingMm} />
        </TabsContent>

        <TabsContent value="costs" className="mt-4">
          <CostsBreakdown layers={layers} studSpacingMm={studSpacingMm} />
        </TabsContent>

        <TabsContent value="tech" className="mt-4">
          <TechnicalSheet
            layers={layers}
            studSpacingMm={studSpacingMm}
            systemCode={layers.length > 0 ? systemCode : undefined}
            typology={typology}
            wallThicknessMm={wallThicknessMm}
            stratigraphyName={stratigraphyName}
            stratigraphyDescription={stratigraphyDescription}
            totalCostPerSqm={totalCostPerSqm}
          />
        </TabsContent>
      </Tabs>

      {/* Box prestazioni (placeholder) */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: 'EI', value: '—', sub: 'fuoco' },
            { label: 'Rw', value: '—', sub: 'fonoiso.' },
            { label: 'λ', value: '—', sub: 'termico' },
            { label: 'Peso', value: '—', sub: 'kg/m²' },
          ].map((m) => (
            <div key={m.label}>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</div>
              <div className="text-2xl font-semibold text-zinc-400">{m.value}</div>
              <div className="text-[9px] text-muted-foreground">{m.sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Spessore parete</span>
          <span className="font-mono font-medium text-zinc-700">{wallThicknessMm.toFixed(1)} mm</span>
        </div>
        {Math.abs(totalThicknessMm - wallThicknessMm) > 0.5 && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 mt-0.5">
            <span>Somma layer (raw)</span>
            <span className="font-mono">{totalThicknessMm.toFixed(1)} mm</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VisualizationPanel;
