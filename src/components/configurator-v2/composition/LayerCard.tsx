import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2, Copy, AlertCircle, Square, RectangleVertical, RectangleHorizontal, Layers, Wrench, Package, Brush } from 'lucide-react';
import type { LayerV2 } from '../types';
import type { DatabaseMaterial } from '@/hooks/useMaterials';
import type { ScrewSuggestion } from '../hooks/screwRecommendation';
import LayerScrewSelectorV2 from './LayerScrewSelectorV2';

interface LayerCardProps {
  layer: LayerV2;
  /** Suggestion vite per questo layer (presente solo se category=board). */
  screwSuggestion?: ScrewSuggestion;
  onUpdate: (patch: Partial<LayerV2>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onClickMaterial: () => void;
  /** Override manuale vite — disattiva auto-suggest. */
  onChangeScrew?: (screw: DatabaseMaterial | null) => void;
  /** Override manuale quantità viti/m². */
  onChangeScrewQty?: (qty: number) => void;
  /** Riattiva l'auto-suggest e applica la vite raccomandata. */
  onReapplyScrewSuggestion?: () => void;
}

/**
 * Card singola di un layer nella composizione, con drag handle dnd-kit.
 *
 * Vedi `docs/mockupui.md` §7 per anatomia card.
 */
const LayerCard: React.FC<LayerCardProps> = ({
  layer,
  screwSuggestion,
  onUpdate,
  onRemove,
  onDuplicate,
  onClickMaterial,
  onChangeScrew,
  onChangeScrewQty,
  onReapplyScrewSuggestion,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isIncomplete = !layer.materialId || layer.thickness <= 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative ${isIncomplete ? 'border-amber-300 bg-amber-50/30' : ''} ${
        isDragging ? 'shadow-lg ring-2 ring-primary/40' : 'shadow-sm hover:shadow-md transition-shadow'
      }`}
    >
      <div className="flex items-stretch">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex items-center px-2 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary rounded-l"
          aria-label={`Trascina layer ${layer.position}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Contenuto */}
        <div className="flex-1 p-3 min-w-0">
          {/* Header: posizione + nome materiale (cliccabile) */}
          <button
            onClick={onClickMaterial}
            className="w-full text-left flex items-start gap-2 group"
          >
            <CategoryIcon category={layer.material?.category} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-muted-foreground">#{layer.position}</span>
                {layer.material ? (
                  <>
                    <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {layer.material.name}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {categoryShortLabel(layer.material.category)}
                    </Badge>
                  </>
                ) : (
                  <span className="text-sm text-amber-700 inline-flex items-center gap-1 group-hover:text-amber-900">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Clicca per scegliere materiale
                  </span>
                )}
              </div>
              {layer.material && (
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {layer.material.supplier}
                  {layer.material.material_type && ` · ${layer.material.material_type}`}
                </div>
              )}
            </div>
          </button>

          {/* Spessore + costo */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-muted-foreground">Spessore</label>
              <Input
                type="number"
                value={layer.thickness}
                onChange={(e) => onUpdate({ thickness: Number(e.target.value) || 0 })}
                className="h-7 w-20 text-xs"
                step="0.5"
                min="0"
                aria-label={`Spessore layer ${layer.position}`}
              />
              <span className="text-[11px] text-muted-foreground">mm</span>
            </div>
            {layer.material && (
              <div className="text-[11px] text-muted-foreground">
                <span className="font-medium text-green-700">
                  €{(layer.material.net_price ?? layer.material.unit_price ?? 0).toFixed(2)}/{layer.material.unit}
                </span>
              </div>
            )}
          </div>

          {/* Selettore vite (solo per layer board con materiale assegnato) */}
          {layer.material?.category === 'board' && layer.materialId && onChangeScrew && onChangeScrewQty && onReapplyScrewSuggestion && (
            <LayerScrewSelectorV2
              layer={layer}
              suggestion={screwSuggestion}
              onChangeScrew={onChangeScrew}
              onChangeQuantity={onChangeScrewQty}
              onReapplySuggestion={onReapplyScrewSuggestion}
            />
          )}
        </div>

        {/* Action buttons (duplicate + delete) */}
        <div className="flex flex-col items-stretch border-l border-zinc-100">
          <button
            onClick={onDuplicate}
            className="px-2 py-1 text-zinc-400 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-tr"
            aria-label={`Duplica layer ${layer.position}`}
            title="Duplica layer"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="px-2 py-1 text-zinc-400 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive rounded-br"
            aria-label={`Elimina layer ${layer.position}`}
            title="Elimina layer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
};

const CategoryIcon: React.FC<{ category?: string }> = ({ category }) => {
  const cls = 'h-4 w-4 mt-0.5';
  switch (category) {
    case 'board': return <Square className={`${cls} text-amber-600`} />;
    case 'ceiling_tile': return <Square className={`${cls} text-amber-700`} />;
    case 'structure_frame': return <RectangleVertical className={`${cls} text-zinc-500`} />;
    case 'structure_guide': return <RectangleHorizontal className={`${cls} text-zinc-500`} />;
    case 'insulation': return <Layers className={`${cls} text-yellow-600`} />;
    case 'screw': return <Wrench className={`${cls} text-zinc-700`} />;
    case 'finish': return <Brush className={`${cls} text-purple-600`} />;
    case 'accessory': return <Package className={`${cls} text-blue-600`} />;
    default: return <Square className={`${cls} text-zinc-300`} />;
  }
};

function categoryShortLabel(category: string): string {
  const map: Record<string, string> = {
    board: 'Lastra',
    ceiling_tile: 'Pannello',
    structure_frame: 'Mont.',
    structure_guide: 'Guida',
    insulation: 'Isol.',
    screw: 'Vite',
    finish: 'Finit.',
    accessory: 'Acc.',
    other: 'Altro',
  };
  return map[category] ?? category;
}

export default LayerCard;
