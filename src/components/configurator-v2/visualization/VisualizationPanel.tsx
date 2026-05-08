import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Ruler, Map, Receipt, FileText } from 'lucide-react';
import type { LayerV2 } from '../types';

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
          <Card className="p-6 min-h-[420px] flex items-center justify-center">
            {layers.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <Ruler className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>Inizia ad aggiungere layer</p>
                <p className="text-xs mt-1">Il preview tecnico arriva in Fase V2.1.</p>
              </div>
            ) : (
              <BasicPreview layers={layers} totalThicknessMm={totalThicknessMm} />
            )}
          </Card>
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

/**
 * Preview SVG MOLTO basic per V2.0-S3: rettangoli proporzionali, niente pattern,
 * niente profili reali, niente viti. Solo per dare una sensazione del layer count.
 * Sarà completamente sostituito in V2.1.
 */
const BasicPreview: React.FC<{ layers: LayerV2[]; totalThicknessMm: number }> = ({
  layers,
  totalThicknessMm,
}) => {
  const SCALE = 2; // 2 px per mm
  const totalWidth = Math.max(totalThicknessMm * SCALE, 200);
  const height = 200;

  const colorForCategory = (cat: string | undefined): string => {
    switch (cat) {
      case 'board': return '#F5F1E8';
      case 'ceiling_tile': return '#F5F1E8';
      case 'insulation': return '#FFE08A';
      case 'structure_frame': return '#9CA3AF';
      case 'structure_guide': return '#D1D5DB';
      case 'screw': return '#1F2937';
      case 'finish': return '#E5E7EB';
      default: return '#FFFFFF';
    }
  };

  let cursor = 0;
  return (
    <svg width="100%" height={height + 40} viewBox={`0 0 ${totalWidth} ${height + 40}`} className="overflow-visible">
      {layers.map((layer) => {
        const w = (Number(layer.thickness) || 0) * SCALE;
        const x = cursor;
        cursor += w;
        if (w < 0.5) return null;
        const cat = layer.material?.category;
        return (
          <g key={layer.id}>
            <rect
              x={x}
              y={20}
              width={w}
              height={height}
              fill={colorForCategory(cat)}
              stroke="#1F2937"
              strokeWidth={0.6}
            />
            <text
              x={x + w / 2}
              y={15}
              textAnchor="middle"
              fontSize={10}
              fill="#374151"
              className="font-mono"
            >
              {Number(layer.thickness).toFixed(1)}
            </text>
            <text
              x={x + w / 2}
              y={height + 35}
              textAnchor="middle"
              fontSize={9}
              fill="#6B7280"
            >
              {layer.material?.name?.slice(0, 14) ?? '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default VisualizationPanel;
