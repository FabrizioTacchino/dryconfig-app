import React from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { LayerV2 } from '../types';
import type { DatabaseMaterial } from '@/hooks/useMaterials';

interface LayersPanelProps {
  layers: LayerV2[];
  onAddLayer: (initial?: Partial<LayerV2>) => string;
  onUpdateLayer: (id: string, patch: Partial<LayerV2>) => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onSetMaterial: (layerId: string, material: DatabaseMaterial) => void;
}

/**
 * Pannello sinistro: lista dei layer della stratigrafia.
 *
 * V2.0-S3: lista basic con thickness editabile, senza materiale.
 * V2.0-S4: drag&drop con dnd-kit + zone semantiche.
 * V2.0-S5: il click sul layer apre il MaterialPickerDialog.
 *
 * Vedi `docs/mockupui.md` §7.
 */
const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
}) => {
  const handleAddLayer = () => {
    onAddLayer({ thickness: 12.5 }); // default lastra 12.5
  };

  return (
    <div className="space-y-4">
      {/* CTA principali */}
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
        <Button onClick={handleAddLayer} variant="default" className="justify-start gap-2 h-12">
          <Plus className="h-4 w-4" />
          Aggiungi layer
        </Button>
      </div>

      {/* Lista layer */}
      {layers.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
          Nessun layer ancora.<br />
          Clicca <span className="font-medium">Aggiungi layer</span> per iniziare.
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Composizione ({layers.length} layer)
          </div>
          {layers.map((layer) => (
            <LayerCardBasic
              key={layer.id}
              layer={layer}
              onUpdate={(patch) => onUpdateLayer(layer.id, patch)}
              onRemove={() => onRemoveLayer(layer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Card semplice per il singolo layer (V2.0-S3).
 * Sarà sostituita da una versione drag&drop completa in S4.
 */
const LayerCardBasic: React.FC<{
  layer: LayerV2;
  onUpdate: (patch: Partial<LayerV2>) => void;
  onRemove: () => void;
}> = ({ layer, onUpdate, onRemove }) => {
  const isIncomplete = !layer.materialId || layer.thickness <= 0;
  return (
    <Card className={`p-3 ${isIncomplete ? 'border-amber-300 bg-amber-50/30' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">#{layer.position}</span>
            {layer.material ? (
              <>
                <span className="font-medium text-sm">{layer.material.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {layer.material.category}
                </Badge>
              </>
            ) : (
              <span className="text-sm text-amber-700 inline-flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Materiale da selezionare (in arrivo V2.0-S5)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <label className="text-xs text-muted-foreground">Spessore:</label>
            <Input
              type="number"
              value={layer.thickness}
              onChange={(e) => onUpdate({ thickness: Number(e.target.value) || 0 })}
              className="h-7 w-20 text-xs"
              step="0.5"
              min="0"
            />
            <span className="text-xs text-muted-foreground">mm</span>
          </div>
        </div>

        <Button
          onClick={onRemove}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={`Elimina layer ${layer.position}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default LayersPanel;
