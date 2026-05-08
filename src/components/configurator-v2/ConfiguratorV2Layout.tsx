import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Eye, Receipt } from 'lucide-react';

interface ConfiguratorV2LayoutProps {
  /** Pannello superiore: header (BackButton, nome, codice, salva). Sempre visibile. */
  header: React.ReactNode;
  /** Pannello sinistro su desktop, tab "Configura" su mobile: lista layer + form. */
  composition: React.ReactNode;
  /** Pannello destro su desktop, tab "Anteprima"+"Costi" su mobile: SVG + box prestazioni. */
  visualization: React.ReactNode;
}

/**
 * Layout responsive del Configuratore V2.
 *
 * - Desktop ≥1280px: split 40/60 (form sx · visualization dx sticky).
 * - Tablet 768-1279px: split 45/55 (form più stretto).
 * - Mobile <768px: tab a 3 vie (Configura | Anteprima | Costi).
 *
 * Vedi `docs/mockupui.md` §3-§5.
 */
const ConfiguratorV2Layout: React.FC<ConfiguratorV2LayoutProps> = ({
  header,
  composition,
  visualization,
}) => {
  const [mobileTab, setMobileTab] = useState<'compose' | 'preview' | 'costs'>('compose');

  return (
    <div className="flex flex-col h-full">
      {/* HEADER (sempre visibile) */}
      <div className="border-b bg-background sticky top-0 z-30">
        <div className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-3">
          {header}
        </div>
      </div>

      {/* DESKTOP / TABLET — split layout */}
      <div className="hidden md:block flex-1">
        <div className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-6">
          <div className="grid gap-6 grid-cols-[minmax(380px,45fr)_minmax(0,55fr)] xl:grid-cols-[minmax(480px,40fr)_minmax(0,60fr)]">
            {/* COMPOSIZIONE (sx) */}
            <div className="min-w-0">
              {composition}
            </div>

            {/* VISUALIZZAZIONE (dx, sticky) */}
            <div className="min-w-0">
              <div className="sticky top-24">
                {visualization}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE — tab a 3 vie */}
      <div className="md:hidden flex-1 flex flex-col">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as typeof mobileTab)}
          className="flex-1 flex flex-col"
        >
          <TabsList className="sticky top-[60px] z-20 grid grid-cols-3 rounded-none border-b bg-background h-12 p-0">
            <TabsTrigger value="compose" className="data-[state=active]:bg-muted h-full rounded-none">
              <LayoutGrid className="h-4 w-4 mr-1.5" /> Configura
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-muted h-full rounded-none">
              <Eye className="h-4 w-4 mr-1.5" /> Anteprima
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-muted h-full rounded-none">
              <Receipt className="h-4 w-4 mr-1.5" /> Costi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 px-4 py-4 mt-0">
            {composition}
          </TabsContent>
          <TabsContent value="preview" className="flex-1 px-4 py-4 mt-0">
            {visualization}
          </TabsContent>
          <TabsContent value="costs" className="flex-1 px-4 py-4 mt-0">
            {/* I costi nel mobile sono già inclusi sotto il preview. Per ora duplichiamo la
                visualization; in fase V2.3 separeremo in CostBreakdownPanel dedicato. */}
            {visualization}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ConfiguratorV2Layout;
