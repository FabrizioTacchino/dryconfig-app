import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import ConfiguratorV2Layout from '@/components/configurator-v2/ConfiguratorV2Layout';
import ConfiguratorHeader from '@/components/configurator-v2/header/ConfiguratorHeader';
import LayersPanel from '@/components/configurator-v2/composition/LayersPanel';
import VisualizationPanel from '@/components/configurator-v2/visualization/VisualizationPanel';
import { useConfiguratorState } from '@/components/configurator-v2/hooks/useConfiguratorState';

/**
 * ConfiguratorV2 — Pagina del nuovo editor di stratigrafie pareti a secco.
 *
 * Carica una stratigrafia esistente da `?id=<uuid>` o crea da zero.
 * Vedi `docs/mockupui.md` per il design.
 */
const ConfiguratorV2: React.FC = () => {
  const [searchParams] = useSearchParams();
  const stratigraphyId = searchParams.get('id');

  const state = useConfiguratorState({ stratigraphyId });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-zinc-50/50">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1">
            {state.isLoading ? (
              <div className="container mx-auto max-w-screen-2xl px-6 py-12">
                <div className="text-center text-muted-foreground">Caricamento stratigrafia…</div>
              </div>
            ) : state.loadError ? (
              <div className="container mx-auto max-w-screen-2xl px-6 py-12">
                <div className="text-center text-destructive">
                  Errore nel caricamento: {state.loadError}
                </div>
              </div>
            ) : (
              <ConfiguratorV2Layout
                header={
                  <ConfiguratorHeader
                    name={state.name}
                    onNameChange={state.setName}
                    systemCode={state.layers.length > 0 ? state.systemCode : null}
                    typology={state.layers.length > 0 ? state.typologyLabel : null}
                    supplierFilterLabel={null}
                    isDirty={state.isDirty}
                    isSaving={state.isSaving}
                    onSave={state.save}
                    canSave={state.canSave}
                  />
                }
                composition={
                  <LayersPanel
                    layers={state.layers}
                    onAddLayer={state.addLayer}
                    onUpdateLayer={state.updateLayer}
                    onRemoveLayer={state.removeLayer}
                    onReorderLayers={state.reorderLayers}
                    onSetMaterial={state.setMaterial}
                  />
                }
                visualization={
                  <VisualizationPanel
                    layers={state.layers}
                    totalThicknessMm={state.totalThicknessMm}
                  />
                }
              />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ConfiguratorV2;
