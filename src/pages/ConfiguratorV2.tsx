import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import ConfiguratorV2Layout from '@/components/configurator-v2/ConfiguratorV2Layout';
import ConfiguratorHeader from '@/components/configurator-v2/header/ConfiguratorHeader';
import LayersPanel from '@/components/configurator-v2/composition/LayersPanel';
import VisualizationPanel from '@/components/configurator-v2/visualization/VisualizationPanel';
import StratigraphyListV2 from '@/components/configurator-v2/list-view/StratigraphyListV2';
import AddToEstimateDialogV2 from '@/components/configurator-v2/estimates/AddToEstimateDialogV2';
import EstimateContextBanner from '@/components/configurator-v2/estimates/EstimateContextBanner';
import DeleteStratigraphyDialog from '@/components/configurator-v2/list-view/DeleteStratigraphyDialog';
import NameConflictDialog from '@/components/configurator-v2/header/NameConflictDialog';
import { useConfiguratorState, type NameConflict } from '@/components/configurator-v2/hooks/useConfiguratorState';
import { useStratigraphyCosts } from '@/components/configurator-v2/hooks/useStratigraphyCosts';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeSnapshotLayers } from '@/components/configurator-v2/hooks/normalizeSnapshotLayers';
import type { LayerV2 } from '@/components/configurator-v2/types';

/**
 * ConfiguratorV2 — Pagina del nuovo editor di stratigrafie pareti a secco.
 *
 * Routing condizionale:
 *  - `?id=<uuid>` → modifica stratigrafia esistente (builder)
 *  - `?new=true`  → crea nuova stratigrafia da zero (builder vuoto)
 *  - nessun param → mostra lista delle stratigrafie con search e filtri
 *
 * Vedi `docs/mockupui.md` per il design.
 */
const ConfiguratorV2: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Param V2 + adapter retro-compatibilità V1: tutti i navigate("/configurator?...")
  // sparsi in app (EstimatesList, EstimateStratigraphyActions, ecc.) usavano:
  //   ?stratigraphyId | ?editStratigraphy | ?editCertifiedStratigraphy → ID stratigrafia
  //   ?estimateId | ?estimate                                          → ID preventivo
  //   ?tab=builder                                                     → "nuovo"
  // Li mappiamo trasparentemente sui nuovi param V2.
  const stratigraphyId =
    searchParams.get('id') ??
    searchParams.get('stratigraphyId') ??
    searchParams.get('editStratigraphy') ??
    searchParams.get('editCertifiedStratigraphy');
  const isNew =
    searchParams.get('new') === 'true' ||
    searchParams.get('tab') === 'builder';
  const estimateId =
    searchParams.get('estimate') ??
    searchParams.get('estimateId');
  // F5.6: param `?fromEstimateStratigraphy=<id>` precarica il builder con
  // i layer di una row orfana (snapshot) per ricreare la stratigrafia nel
  // catalogo. Forza modalità "nuova" anche senza ?new=true.
  const fromEstimateStratigraphy = searchParams.get('fromEstimateStratigraphy');
  const showBuilder = !!stratigraphyId || isNew || !!fromEstimateStratigraphy;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-zinc-50/50">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1">
            {estimateId && <EstimateContextBanner estimateId={estimateId} />}
            {showBuilder ? (
              <ConfiguratorBuilderView
                stratigraphyId={stratigraphyId}
                preselectedEstimateId={estimateId}
                fromEstimateStratigraphyId={fromEstimateStratigraphy}
              />
            ) : (
              <StratigraphyListV2 estimateId={estimateId} />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

/**
 * Vista builder: estratta come componente separato così l'hook
 * useConfiguratorState non viene chiamato condizionalmente nel parent.
 */
const ConfiguratorBuilderView: React.FC<{
  stratigraphyId: string | null;
  preselectedEstimateId?: string | null;
  /** F5.6: ID estimate_stratigraphy da cui pre-caricare i layer (snapshot orfano). */
  fromEstimateStratigraphyId?: string | null;
}> = ({ stratigraphyId, preselectedEstimateId, fromEstimateStratigraphyId }) => {
  // Quando arriviamo da un snapshot orfano, fetchiamo i suoi `layers_data` +
  // `name` e li passiamo come stato iniziale al builder. Niente `id` viene
  // settato → il save creerà una NUOVA stratigrafia nel catalogo.
  const { data: fromSnapshot, isLoading: snapshotLoading } = useQuery({
    queryKey: ['estimate-stratigraphy-snapshot', fromEstimateStratigraphyId],
    enabled: !!fromEstimateStratigraphyId && !stratigraphyId,
    staleTime: 0,
    queryFn: async () => {
      if (!fromEstimateStratigraphyId) return null;
      const { data, error } = await supabase
        .from('estimate_stratigraphies')
        .select('id, name, layers_data')
        .eq('id', fromEstimateStratigraphyId)
        .maybeSingle();
      if (error) {
        console.error('[fromSnapshot] fetch error:', error);
        return null;
      }
      return data;
    },
  });

  // Raccolta material_id e screw_material_id dallo snapshot per refresh fresh
  // dal catalogo: lo snapshot conserva solo un subset di campi (manca `length`
  // sulle viti → "Vite 0mm insufficiente"). Re-fetchando da materials_with_pricing
  // recuperiamo tutti i campi tecnici e i prezzi correnti.
  const snapshotMaterialIds = React.useMemo(() => {
    if (!fromSnapshot?.layers_data || !Array.isArray(fromSnapshot.layers_data)) return [];
    const ids = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const l of fromSnapshot.layers_data as any[]) {
      if (l?.material_id) ids.add(String(l.material_id));
      if (l?.screw_material_id) ids.add(String(l.screw_material_id));
    }
    return Array.from(ids).sort();
  }, [fromSnapshot]);

  const { data: freshMaterials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['snapshot-fresh-materials', snapshotMaterialIds.join(',')],
    enabled: snapshotMaterialIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('materials_with_pricing' as any)
        .select('*')
        .in('id', snapshotMaterialIds);
      if (error) {
        console.error('[snapshot-fresh-materials] fetch error:', error);
        return [];
      }
      return (data ?? []) as Array<{ id: string } & Record<string, unknown>>;
    },
  });

  const initialLayers: LayerV2[] | undefined = React.useMemo(() => {
    if (!fromSnapshot?.layers_data || !Array.isArray(fromSnapshot.layers_data)) return undefined;
    // Mappa id → materiale fresco dal catalogo
    const freshMap = new Map(freshMaterials.map(m => [m.id, m]));
    // Merge: i campi del catalogo soppiantano quelli dello snapshot dove
    // disponibili. Se un materiale è stato eliminato dal catalogo, manteniamo
    // i dati parziali dello snapshot (degrade graceful: l'utente vedrà i
    // warning di regole tecniche e potrà rimpiazzare il materiale).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = (fromSnapshot.layers_data as any[]).map((l) => {
      const matFresh = l?.material_id ? freshMap.get(String(l.material_id)) : null;
      const screwFresh = l?.screw_material_id ? freshMap.get(String(l.screw_material_id)) : null;
      return {
        ...l,
        materials: matFresh ?? l?.materials ?? null,
        screw_materials: screwFresh ?? l?.screw_materials ?? null,
      };
    });
    return normalizeSnapshotLayers(enriched);
  }, [fromSnapshot, freshMaterials]);

  const initialName = fromSnapshot?.name ? `${fromSnapshot.name} (da snapshot)` : undefined;

  const state = useConfiguratorState({
    stratigraphyId,
    initialLayers,
    initialName,
  });
  const { breakdown } = useStratigraphyCosts(state.layers, state.studSpacingMm);
  const [showEstimateDialog, setShowEstimateDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [pendingDialogEstimate, setPendingDialogEstimate] = React.useState<string | null>(null);
  // Dialog conflitto nome: tracciamo l'esistente + l'azione che l'utente
  // stava tentando, così "Salva comunque" sa quale flusso completare.
  const [nameConflict, setNameConflict] = React.useState<{
    existing: NameConflict;
    pendingAction: 'save' | 'addToEstimate';
  } | null>(null);
  const navigate = useNavigate();

  /**
   * Esegue il flusso "Salva e aggiungi a preventivo" SENZA check duplicato.
   * Il check è gestito dai wrapper qui sotto.
   */
  const doAddToEstimate = async () => {
    if (!state.canSave && !state.id) return;
    const newId = await state.saveAsync();
    if (newId) {
      setShowEstimateDialog(true);
    }
  };

  /**
   * Wrapper "Salva": prima check duplicato; se trovato, apre il dialog.
   * Se l'utente ha già una stratigrafia con id (sta editando) e il nome non
   * è cambiato, il check ritorna null automaticamente perché esclude self.
   */
  const handleSaveClick = async () => {
    if (!state.canSave) {
      state.save(); // delega gli error toast a save()
      return;
    }
    const conflict = await state.checkNameConflict();
    if (conflict) {
      setNameConflict({ existing: conflict, pendingAction: 'save' });
      return;
    }
    state.save();
  };

  /** Wrapper "Salva e aggiungi a preventivo" con check duplicato. */
  const handleAddToEstimateClick = async () => {
    if (!state.canSave && !state.id) return;
    const conflict = await state.checkNameConflict();
    if (conflict) {
      setNameConflict({ existing: conflict, pendingAction: 'addToEstimate' });
      return;
    }
    void doAddToEstimate();
  };

  /** Risolve il dialog: l'utente conferma "Salva comunque" → procede. */
  const resolveConflictForceSave = () => {
    const action = nameConflict?.pendingAction;
    setNameConflict(null);
    if (action === 'save') state.save();
    else if (action === 'addToEstimate') void doAddToEstimate();
  };

  /** Risolve il dialog: l'utente vuole aprire l'esistente. */
  const resolveConflictOpenExisting = () => {
    const existingId = nameConflict?.existing.id;
    setNameConflict(null);
    if (existingId) navigate(`/configurator?id=${existingId}`);
  };

  /** Su success aggiunta preventivo: redirect al preventivo. */
  const handleEstimateAdded = (estimateId: string) => {
    setPendingDialogEstimate(estimateId);
    setShowEstimateDialog(false);
    // Naviga al preventivo dopo il close del dialog
    setTimeout(() => {
      navigate(`/estimates/${estimateId}/manage`);
    }, 100);
  };

  if (state.isLoading || snapshotLoading || (fromEstimateStratigraphyId && materialsLoading)) {
    return (
      <div className="container mx-auto max-w-screen-2xl px-6 py-12">
        <div className="text-center text-muted-foreground">
          {snapshotLoading || materialsLoading ? 'Caricamento snapshot…' : 'Caricamento stratigrafia…'}
        </div>
      </div>
    );
  }
  if (state.loadError) {
    return (
      <div className="container mx-auto max-w-screen-2xl px-6 py-12">
        <div className="text-center text-destructive">
          Errore nel caricamento: {state.loadError}
        </div>
      </div>
    );
  }
  return (
    <>
      <ConfiguratorV2Layout
        header={
          <ConfiguratorHeader
            name={state.name}
            onNameChange={state.setName}
            systemCode={state.layers.length > 0 ? state.systemCode : null}
            typology={state.layers.length > 0 ? state.typologyLabel : null}
            supplierFilterLabel={null}
            isCertified={state.isCertified}
            isDirty={state.isDirty}
            isSaving={state.isSaving}
            onSave={handleSaveClick}
            canSave={state.canSave}
            canAddToEstimate={state.canSave || !!state.id}
            onAddToEstimate={handleAddToEstimateClick}
            canDelete={!!state.id}
            onDelete={() => setShowDeleteDialog(true)}
          />
        }
        composition={
          <LayersPanel
            layers={state.layers}
            studSpacingMm={state.studSpacingMm}
            onAddLayer={state.addLayer}
            onUpdateLayer={state.updateLayer}
            onRemoveLayer={state.removeLayer}
            onDuplicateLayer={state.duplicateLayer}
            onReorderLayers={state.reorderLayers}
            onSetMaterial={state.setMaterial}
            onSetScrewMaterial={state.setScrewMaterial}
            onSetScrewQuantity={state.setScrewQuantity}
            onReapplyScrewSuggestion={state.reapplyScrewSuggestion}
            onSetStudSpacing={state.setStudSpacingMm}
            isCertified={state.isCertified}
            certification={state.certification}
            onSetCertification={state.setCertification}
            currentStratigraphyId={state.id}
            onReplaceWithCertified={(id) => navigate(`/configurator?id=${id}`)}
          />
        }
        visualization={
          <VisualizationPanel
            layers={state.layers}
            totalThicknessMm={state.totalThicknessMm}
            studSpacingMm={state.studSpacingMm}
            stratigraphyName={state.name}
            stratigraphyDescription={state.description}
            totalCostPerSqm={breakdown.totalCost}
          />
        }
      />

      <AddToEstimateDialogV2
        open={showEstimateDialog}
        onOpenChange={setShowEstimateDialog}
        stratigraphyId={state.id}
        stratigraphyName={state.name}
        stratigraphyDescription={state.description}
        costPerSqm={breakdown.totalCost}
        preselectedEstimateId={preselectedEstimateId}
        onAdded={handleEstimateAdded}
      />

      <DeleteStratigraphyDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        stratigraphyId={state.id}
        stratigraphyName={state.name}
        onDeleted={() => navigate('/configurator')}
      />

      <NameConflictDialog
        open={!!nameConflict}
        onOpenChange={(open) => { if (!open) setNameConflict(null); }}
        existing={nameConflict?.existing ?? null}
        pendingAction={nameConflict?.pendingAction ?? 'save'}
        onForceSave={resolveConflictForceSave}
        onOpenExisting={resolveConflictOpenExisting}
        onChangeName={() => setNameConflict(null)}
      />
    </>
  );
};

export default ConfiguratorV2;
