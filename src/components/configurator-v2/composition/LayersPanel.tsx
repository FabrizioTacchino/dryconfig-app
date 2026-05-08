import React, { useState } from 'react';
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
import MaterialPickerDialog from '../material-picker/MaterialPickerDialog';
import { useTypologyDetection, typologyLabel } from '../hooks/useTypologyDetection';
import type { LayerV2 } from '../types';
import type { DatabaseMaterial, MaterialCategory } from '@/hooks/useMaterials';

interface LayersPanelProps {
  layers: LayerV2[];
  onAddLayer: (initial?: Partial<LayerV2>) => string;
  onUpdateLayer: (id: string, patch: Partial<LayerV2>) => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onSetMaterial: (layerId: string, material: DatabaseMaterial) => void;
}

/**
 * Pannello sinistro: lista layer con drag&drop dnd-kit + zone semantiche +
 * material picker integrato.
 *
 * Vedi `docs/mockupui.md` §7.
 */
const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onReorderLayers,
  onSetMaterial,
}) => {
  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLayerId, setPickerLayerId] = useState<string | null>(null);
  const [pickerCategory, setPickerCategory] = useState<MaterialCategory | 'all'>('all');

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
                      onUpdate={(patch) => onUpdateLayer(entry.layer.id, patch)}
                      onRemove={() => onRemoveLayer(entry.layer.id)}
                      onClickMaterial={() => openPickerForLayer(entry.layer.id, entry.layer)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
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
  // Niente zone se non ho ancora una struttura: lista piatta
  const structureIdx = layers.findIndex(l => l.material?.category === 'structure_frame');

  // Per controsoffitto / controparete / unknown, mostro divider semplificati o nessuno
  if (typology !== 'partition' || structureIdx === -1) {
    if (layers.length === 0) return [];
    return [
      { kind: 'divider', label: 'Composizione' },
      ...layers.map(l => ({ kind: 'layer' as const, layer: l })),
    ];
  }

  // Parete divisoria: 3 zone
  const before = layers.slice(0, structureIdx);
  const struct = [layers[structureIdx]];
  const after = layers.slice(structureIdx + 1);

  // Estendi "Struttura" includendo isolanti adiacenti dopo il primo structure_frame
  let extendedStructEnd = structureIdx + 1;
  while (
    extendedStructEnd < layers.length &&
    (layers[extendedStructEnd].material?.category === 'insulation' ||
      layers[extendedStructEnd].material?.category === 'structure_guide' ||
      layers[extendedStructEnd].material?.category === 'structure_frame')
  ) {
    struct.push(layers[extendedStructEnd]);
    extendedStructEnd++;
  }
  const realAfter = layers.slice(extendedStructEnd);

  const entries: ZonedEntry[] = [];
  entries.push({ kind: 'divider', label: 'Lato A (esterno)' });
  before.forEach(l => entries.push({ kind: 'layer', layer: l }));
  entries.push({ kind: 'divider', label: 'Struttura' });
  struct.forEach(l => entries.push({ kind: 'layer', layer: l }));
  if (realAfter.length > 0) {
    entries.push({ kind: 'divider', label: 'Lato B (interno)' });
    realAfter.forEach(l => entries.push({ kind: 'layer', layer: l }));
  }
  return entries;
}

export default LayersPanel;
