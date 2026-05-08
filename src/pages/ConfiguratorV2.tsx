import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import ConfiguratorV2Layout from '@/components/configurator-v2/ConfiguratorV2Layout';
import ConfiguratorHeader from '@/components/configurator-v2/header/ConfiguratorHeader';
import LayersPanel from '@/components/configurator-v2/composition/LayersPanel';
import VisualizationPanel from '@/components/configurator-v2/visualization/VisualizationPanel';

/**
 * ConfiguratorV2 — Pagina del nuovo editor di stratigrafie pareti a secco.
 *
 * Stato V2.0-S2: layout shell completo. State e DB integration in V2.0-S3.
 * Vedi `docs/mockupui.md` per il design completo.
 */
const ConfiguratorV2: React.FC = () => {
  // Stato locale temporaneo, sostituito da useConfiguratorState in V2.0-S3.
  const [name, setName] = useState('');
  const [isDirty] = useState(false);
  const [isSaving] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-zinc-50/50">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1">
            <ConfiguratorV2Layout
              header={
                <ConfiguratorHeader
                  name={name}
                  onNameChange={setName}
                  systemCode={null}
                  typology={null}
                  supplierFilterLabel={null}
                  isDirty={isDirty}
                  isSaving={isSaving}
                  onSave={() => { /* in arrivo V2.0-S3 */ }}
                  canSave={false}
                />
              }
              composition={<LayersPanel />}
              visualization={<VisualizationPanel />}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ConfiguratorV2;
