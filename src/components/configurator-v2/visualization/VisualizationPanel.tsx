import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Ruler, Map, Receipt, FileText } from 'lucide-react';
import type { LayerV2 } from '../types';
import TechnicalWallDrawing from './section-view/TechnicalWallDrawing';
import { useSystemCode } from '../hooks/useSystemCode';
import { useTypologyDetection } from '../hooks/useTypologyDetection';

interface VisualizationPanelProps {
  layers: LayerV2[];
  totalThicknessMm: number;
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
}) => {
  const typology = useTypologyDetection(layers);
  const systemCode = useSystemCode({ typology, layers });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="section" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="section"><Ruler className="h-4 w-4 mr-1.5" /> Sezione</TabsTrigger>
          <TabsTrigger value="plan"><Map className="h-4 w-4 mr-1.5" /> Pianta</TabsTrigger>
          <TabsTrigger value="costs"><Receipt className="h-4 w-4 mr-1.5" /> Costi</TabsTrigger>
          <TabsTrigger value="tech"><FileText className="h-4 w-4 mr-1.5" /> Tecnico</TabsTrigger>
        </TabsList>

        <TabsContent value="section" className="mt-4">
          <TechnicalWallDrawing
            layers={layers}
            systemCode={layers.length > 0 ? systemCode : undefined}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
            <div>
              <Map className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Vista pianta con interasse montanti</p>
              <p className="text-xs mt-1">Arriva in Fase V2.3.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="mt-4">
          <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
            <div>
              <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Breakdown costi stile fattura</p>
              <p className="text-xs mt-1">Arriva in Fase V2.3.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tech" className="mt-4">
          <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
            <div>
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Riepilogo tecnico stile catalogo Knauf</p>
              <p className="text-xs mt-1">Arriva in Fase V2.3.</p>
            </div>
          </Card>
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
          <span>Spessore totale</span>
          <span className="font-mono font-medium text-zinc-700">{totalThicknessMm.toFixed(1)} mm</span>
        </div>
      </Card>
    </div>
  );
};

export default VisualizationPanel;
