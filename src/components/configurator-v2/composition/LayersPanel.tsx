import React, { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import LayerCard from './LayerCard';
import CertificationPanel from './CertificationPanel';
import CertifiedMatchBanner from './CertifiedMatchBanner';
import MaterialPickerDialog from '../material-picker/MaterialPickerDialog';
import { useTypologyDetection, typologyLabel } from '../hooks/useTypologyDetection';
import { useScrewSuggestions } from '../hooks/useScrewSuggestions';
import { useCertifiedMatch } from '../hooks/useCertifiedMatch';
import { fingerprintComposition, serializeFingerprint } from '../hooks/compositionFingerprint';
import type { CertificationData } from '../hooks/useConfiguratorState';
import type { LayerV2 } from '../types';
import type { DatabaseMaterial, MaterialCategory } from '@/hooks/useMaterials';

interface LayersPanelProps {
  layers: LayerV2[];
  studSpacingMm: 300 | 400 | 600;
  onAddLayer: (initial?: Partial<LayerV2>) => string;
  onUpdateLayer: (id: string, patch: Partial<LayerV2>) => void;
  onRemoveLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => string | null;
  onReorderLayers: (orderedIds: string[]) => void;
  onSetMaterial: (layerId: string, material: DatabaseMaterial) => void;
  onSetScrewMaterial: (layerId: string, screw: DatabaseMaterial | null) => void;
  onSetScrewQuantity: (layerId: string, qty: number) => void;
  onReapplyScrewSuggestion: (layerId: string) => void;
  onSetStudSpacing: (spacing: 300 | 400 | 600) => void;
  /** Stato certificazione + setter (per il pannello inline). */
  isCertified: boolean;
  certification: CertificationData;
  onSetCertification: (patch: Partial<CertificationData> & { isCertified?: boolean }) => void;
  /** ID stratigrafia corrente (per escluderla dal match). */
  currentStratigraphyId?: string | null;
  /** Callback quando l'utente conferma di aprire la certificata matchata. */
  onReplaceWithCertified?: (certifiedId: string) => void;
}

/**
 * Pannello sinistro: lista layer con drag&drop dnd-kit + zone semantiche +
 * material picker integrato.
 *
 * Vedi `docs/mockupui.md` §7.
 */
const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  studSpacingMm,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onDuplicateLayer,
  onReorderLayers,
  onSetMaterial,
  onSetScrewMaterial,
  onSetScrewQuantity,
  onReapplyScrewSuggestion,
  onSetStudSpacing,
  isCertified,
  certification,
  onSetCertification,
  currentStratigraphyId = null,
  onReplaceWithCertified,
}) => {
  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLayerId, setPickerLayerId] = useState<string | null>(null);
  const [pickerCategory, setPickerCategory] = useState<MaterialCategory | 'all'>('all');

  // Match certificate: cerca composizioni simili nel catalogo certificato.
  // Il banner viene nascosto se l'utente ha cliccato "Continua personalizzata"
  // per questa specifica composizione (chiave = fingerprint serializzato).
  const certifiedMatch = useCertifiedMatch(layers, isCertified, currentStratigraphyId);
  const compositionKey = useMemo(
    () => serializeFingerprint(fingerprintComposition(layers)),
    [layers],
  );
  const [dismissedCompositions, setDismissedCompositions] = useState<Set<string>>(new Set());
  const matchDismissed = dismissedCompositions.has(compositionKey);
  const showMatchBanner = !!certifiedMatch.match && !matchDismissed && !!onReplaceWithCertified;

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layers.findIndex(l => l.id === active.id);
    const newIndex = layers.findIndex(l => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(layers, oldIndex, newIndex);
    onReorderLayers(reordered.map(l => l.id));
  };

  const openPickerForLayer = (layerId: string, layer: LayerV2) => {
    setPickerLayerId(layerId);
    setPickerCategory((layer.material?.category as MaterialCategory) ?? 'all');
    setPickerOpen(true);
  };

  const openPickerForNew = () => {
    const newLayerId = onAddLayer({ thickness: 12.5 });
    setPickerLayerId(newLayerId);
    setPickerCategory('all');
    setPickerOpen(true);
  };

  const handlePickerSelect = (material: DatabaseMaterial) => {
    if (pickerLayerId) onSetMaterial(pickerLayerId, material);
    setPickerLayerId(null);
  };

  // Tipologia + zone semantiche
  const typology = useTypologyDetection(layers);
  const zonedLayers = useMemo_zoned(layers, typology);
  const { suggestions: screwSuggestions } = useScrewSuggestions(layers, typology);

  return (
    <>
      <div className="space-y-4">
        {/* CTA */}
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="justify-start gap-2 h-12"
            disabled
            title="Disponibile in V2.2"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Aggiungi sistema certificato (W111, W112, …)
          </Button>
          <Button onClick={openPickerForNew} variant="default" className="justify-start gap-2 h-12">
            <Plus className="h-4 w-4" />
            Aggiungi layer
          </Button>
        </div>

        {/* Match certificate: appare quando la composizione corrente è simile
            a una stratigrafia certificata già nel catalogo (≥ 80% match). */}
        {showMatchBanner && certifiedMatch.match && onReplaceWithCertified && (
          <CertifiedMatchBanner
            match={certifiedMatch.match}
            onReplace={(id) => onReplaceWithCertified(id)}
            onDismiss={() => setDismissedCompositions(prev => new Set(prev).add(compositionKey))}
          />
        )}

        {/* Passo montanti (interasse) */}
        <div className="flex items-center justify-between gap-2 px-1 py-2 border-t border-zinc-200">
          <div>
            <div className="text-xs font-medium text-zinc-700">Passo montanti</div>
            <div className="text-[10px] text-muted-foreground">
              {studSpacingMm === 300
                ? 'Pareti rigide o alte'
                : studSpacingMm === 400
                ? 'Alte prestazioni'
                : 'Standard'}
            </div>
          </div>
          <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden text-xs font-medium">
            {([300, 400, 600] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSetStudSpacing(value)}
                className={`px-3 py-1.5 transition-colors ${
                  studSpacingMm === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {value} mm
              </button>
            ))}
          </div>
        </div>

        {/* Lista layer con drag&drop + zone */}
        {layers.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
            Nessun layer ancora.<br />
            Clicca <span className="font-medium">Aggiungi layer</span> per iniziare.
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {zonedLayers.map((entry, idx) => {
                  if (entry.kind === 'divider') {
                    return (
                      <div
                        key={`div-${idx}`}
                        className="flex items-center gap-2 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
                      >
                        <div className="flex-1 border-t border-zinc-200" />
                        <span>{entry.label}</span>
                        <div className="flex-1 border-t border-zinc-200" />
                      </div>
                    );
                  }
                  return (
                    <LayerCard
                      key={entry.layer.id}
                      layer={entry.layer}
                      screwSuggestion={screwSuggestions.get(entry.layer.id)}
                      onUpdate={(patch) => onUpdateLayer(entry.layer.id, patch)}
                      onRemove={() => onRemoveLayer(entry.layer.id)}
                      onDuplicate={() => onDuplicateLayer(entry.layer.id)}
                      onClickMaterial={() => openPickerForLayer(entry.layer.id, entry.layer)}
                      onChangeScrew={(s) => onSetScrewMaterial(entry.layer.id, s)}
                      onChangeScrewQty={(q) => onSetScrewQuantity(entry.layer.id, q)}
                      onReapplyScrewSuggestion={() => onReapplyScrewSuggestion(entry.layer.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Pannello certificazione: toggle + accordion con tutti i campi normativi */}
        {layers.length > 0 && (
          <CertificationPanel
            isCertified={isCertified}
            certification={certification}
            onChange={onSetCertification}
          />
        )}

        {/* Footer info: tipologia rilevata */}
        {layers.length > 0 && (
          <div className="text-[11px] text-muted-foreground text-center pt-2">
            Tipologia auto-rilevata: <strong>{typologyLabel(typology)}</strong>
          </div>
        )}
      </div>

      {/* Modal selezione materiale */}
      <MaterialPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialCategory={pickerCategory}
        onSelect={handlePickerSelect}
      />
    </>
  );
};

/**
 * Suddivide la lista layer in zone semantiche (Lato A / Struttura / Lato B)
 * per le pareti divisorie. Per controparete e controsoffitto: mostra solo
 * "Struttura" e "Finitura" o nessun divisore.
 *
 * Inserisce DIVIDER virtuali tra i layer reali.
 */
type ZonedEntry =
  | { kind: 'divider'; label: string }
  | { kind: 'layer'; layer: LayerV2 };

function useMemo_zoned(layers: LayerV2[], typology: ReturnType<typeof useTypologyDetection>): ZonedEntry[] {
  // Lista piatta per controparete / controsoffitto / unknown
  const structureIndices = layers
    .map((l, i) => (l.material?.category === 'structure_frame' ? i : -1))
    .filter(i => i >= 0);

  if (typology !== 'partition' || structureIndices.length === 0) {
    if (layers.length === 0) return [];
    return [
      { kind: 'divider', label: 'Composizione' },
      ...layers.map(l => ({ kind: 'layer' as const, layer: l })),
    ];
  }

  // Helper: estende un'orditura includendo guida + isolante consecutivi
  const extendStructure = (startIdx: number): { layers: LayerV2[]; endIdx: number } => {
    const out: LayerV2[] = [layers[startIdx]];
    let j = startIdx + 1;
    while (j < layers.length) {
      const cj = layers[j].material?.category;
      if (cj === 'insulation' || cj === 'structure_guide') {
        out.push(layers[j]);
        j++;
        continue;
      }
      break;
    }
    return { layers: out, endIdx: j };
  };

  const entries: ZonedEntry[] = [];
  const firstStructIdx = structureIndices[0];

  // Lato A
  const before = layers.slice(0, firstStructIdx);
  entries.push({ kind: 'divider', label: 'Lato A (esterno)' });
  before.forEach(l => entries.push({ kind: 'layer', layer: l }));

  if (structureIndices.length === 1) {
    // Singola orditura: Lato A / Struttura / Lato B
    const { layers: struct, endIdx } = extendStructure(firstStructIdx);
    entries.push({ kind: 'divider', label: 'Struttura' });
    struct.forEach(l => entries.push({ kind: 'layer', layer: l }));
    const after = layers.slice(endIdx);
    if (after.length > 0) {
      entries.push({ kind: 'divider', label: 'Lato B (interno)' });
      after.forEach(l => entries.push({ kind: 'layer', layer: l }));
    }
    return entries;
  }

  // Doppia orditura: Lato A / Orditura 1 / Intercapedine / Orditura 2 / Lato B
  const lastStructIdx = structureIndices[structureIndices.length - 1];
  const { layers: struct1, endIdx: end1 } = extendStructure(firstStructIdx);
  entries.push({ kind: 'divider', label: 'Orditura 1' });
  struct1.forEach(l => entries.push({ kind: 'layer', layer: l }));

  // Intercapedine = layer fra fine orditura 1 e inizio orditura 2 (raro)
  const middle = layers.slice(end1, lastStructIdx);
  if (middle.length > 0) {
    entries.push({ kind: 'divider', label: 'Intercapedine' });
    middle.forEach(l => entries.push({ kind: 'layer', layer: l }));
  }

  const { layers: struct2, endIdx: end2 } = extendStructure(lastStructIdx);
  entries.push({ kind: 'divider', label: 'Orditura 2' });
  struct2.forEach(l => entries.push({ kind: 'layer', layer: l }));

  const after = layers.slice(end2);
  if (after.length > 0) {
    entries.push({ kind: 'divider', label: 'Lato B (interno)' });
    after.forEach(l => entries.push({ kind: 'layer', layer: l }));
  }

  return entries;
}

export default LayersPanel;
