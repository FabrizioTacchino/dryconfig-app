import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Ruler, Map, Receipt, FileText } from 'lucide-react';

/**
 * Pannello destro del configuratore: tab Sezione | Pianta | Costi | Tecnico.
 * Per V2.0-S2 è uno scaffolding: il preview SVG arriva in V2.1.
 *
 * Vedi `docs/mockupui.md` §9-§13.
 */
const VisualizationPanel: React.FC = () => {
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
          <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
            <div>
              <Ruler className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Preview SVG sezione orizzontale</p>
              <p className="text-xs mt-1">Arriva in Fase V2.1 — pattern lana, profili C reali, viti, quote.</p>
            </div>
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
          {['EI', 'Rw', 'λ', 'Peso'].map((label) => (
            <div key={label}>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="text-2xl font-semibold text-zinc-400">—</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default VisualizationPanel;
