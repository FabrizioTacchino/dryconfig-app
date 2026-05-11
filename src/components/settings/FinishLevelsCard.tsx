import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Paintbrush, Plus, Trash2, Clock } from 'lucide-react';
import {
  useFinishLevels,
  useUpdateFinishLevelLabor,
  useAddFinishComponent,
  useUpdateFinishComponent,
  useDeleteFinishComponent,
  computeFinishLevelCost,
  type FinishLevel,
} from '@/hooks/useFinishLevels';
import { useMaterials } from '@/hooks/useMaterials';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Hourly rate da configurator_settings, cached 10min. */
function useHourlyRate(): number {
  const { data } = useQuery({
    queryKey: ['cost_per_hour-finish-levels'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('configurator_settings')
        .select('value')
        .eq('key', 'cost_per_hour')
        .maybeSingle();
      return parseFloat(data?.value ?? '30') || 30;
    },
  });
  return data ?? 30;
}

/**
 * Card Settings → "Livelli di finitura UNI 11424:2015". 4 accordion items
 * Q1-Q4 con descrizione UNI, tempo posa (editabile), lista componenti
 * BOM (aggiungi/edita qty/elimina). Componenti referenziano materiali del
 * catalogo categoria 'finish' o 'accessory' (es. stucco, nastro, garza, primer).
 */
const FinishLevelsCard: React.FC = () => {
  const { data: levels = [], isLoading } = useFinishLevels();
  const { data: materials = [] } = useMaterials();
  const hourlyRate = useHourlyRate();
  const updateLabor = useUpdateFinishLevelLabor();
  const addComponent = useAddFinishComponent();
  const updateComponent = useUpdateFinishComponent();
  const deleteComponent = useDeleteFinishComponent();

  // Solo materiali categoria finitura/accessori per la dropdown
  const finishMaterials = materials.filter(m =>
    m.category === 'finish' || m.category === 'accessory',
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5" />
          Livelli di finitura (UNI 11424:2015)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Componenti (stucco, garza, nastro, ecc.) e tempo posa per ognuno
          dei 4 livelli standard. Il costo finitura viene aggiunto al{' '}
          <strong>costo unitario della parete</strong> quando aggiungi una
          stratigrafia a un preventivo.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Caricamento livelli…</div>
        ) : levels.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nessun livello configurato. Ricarica la pagina o contatta il supporto.
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {levels.map((level) => (
              <FinishLevelAccordion
                key={level.id}
                level={level}
                hourlyRate={hourlyRate}
                materials={finishMaterials}
                onUpdateLabor={(min) => updateLabor.mutate({ id: level.id, labor_minutes_per_sqm: min })}
                onAddComponent={(material_id, qty) =>
                  addComponent.mutate({ finish_level_id: level.id, material_id, quantity_per_sqm: qty })
                }
                onUpdateComponent={(id, qty) => updateComponent.mutate({ id, quantity_per_sqm: qty })}
                onDeleteComponent={(id) => deleteComponent.mutate(id)}
              />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

interface FinishLevelAccordionProps {
  level: FinishLevel;
  hourlyRate: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materials: any[];
  onUpdateLabor: (min: number) => void;
  onAddComponent: (material_id: string, quantity_per_sqm: number) => void;
  onUpdateComponent: (id: string, quantity_per_sqm: number) => void;
  onDeleteComponent: (id: string) => void;
}

const FinishLevelAccordion: React.FC<FinishLevelAccordionProps> = ({
  level,
  hourlyRate,
  materials,
  onUpdateLabor,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
}) => {
  const [laborDraft, setLaborDraft] = useState<string>('');
  const [newMatId, setNewMatId] = useState<string>('');
  const [newQty, setNewQty] = useState<string>('');
  const cost = computeFinishLevelCost(level, hourlyRate);

  const handleLaborBlur = () => {
    if (!laborDraft) return;
    const v = Number(laborDraft.replace(',', '.'));
    if (!Number.isFinite(v) || v < 0) return;
    if (v === level.labor_minutes_per_sqm) {
      setLaborDraft('');
      return;
    }
    onUpdateLabor(v);
    setLaborDraft('');
  };

  const handleAdd = () => {
    if (!newMatId || !newQty) return;
    const qty = Number(newQty.replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) return;
    onAddComponent(newMatId, qty);
    setNewMatId('');
    setNewQty('');
  };

  return (
    <AccordionItem value={level.code}>
      <AccordionTrigger>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant="outline" className="font-mono shrink-0">{level.code}</Badge>
          <span className="font-medium truncate">{level.name.replace(`${level.code} — `, '')}</span>
          <span className="ml-auto text-xs text-muted-foreground font-mono shrink-0">
            €{cost.totalCost.toFixed(2)}/m²
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          {level.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{level.description}</p>
          )}

          {/* Tempo posa */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="text-sm flex-1">Tempo posa manodopera</Label>
            <div className="relative w-28 shrink-0">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={laborDraft || String(level.labor_minutes_per_sqm)}
                onChange={(e) => setLaborDraft(e.target.value)}
                onBlur={handleLaborBlur}
                className="pr-12 text-right"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min/m²</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono w-20 text-right">
              = €{cost.laborCost.toFixed(2)}/m²
            </span>
          </div>

          {/* Componenti BOM */}
          <div>
            <div className="text-xs font-medium text-zinc-700 mb-2 flex items-center justify-between">
              <span>Componenti BOM</span>
              <span className="font-mono text-muted-foreground">Materiali: €{cost.materialsCost.toFixed(2)}/m²</span>
            </div>
            {level.components.length === 0 ? (
              <div className="text-xs text-muted-foreground italic px-2 py-3 border border-dashed rounded">
                Nessun componente. Aggiungine uno dal selettore qui sotto.
              </div>
            ) : (
              <ul className="space-y-1">
                {level.components.map((comp) => (
                  <ComponentRow
                    key={comp.id}
                    comp={comp}
                    onUpdate={(qty) => onUpdateComponent(comp.id, qty)}
                    onDelete={() => onDeleteComponent(comp.id)}
                  />
                ))}
              </ul>
            )}

            {/* Aggiungi componente */}
            <div className="mt-3 grid grid-cols-12 gap-2 items-end">
              <div className="col-span-7">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                  Materiale (finitura o accessorio)
                </Label>
                <Select value={newMatId} onValueChange={setNewMatId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Scegli materiale…" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name} {m.code ? `· ${m.code}` : ''} ({m.unit ?? '—'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                  Qty/m²
                </Label>
                <Input
                  type="number"
                  step="0.001"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="0.000"
                  className="h-8 text-xs text-right"
                />
              </div>
              <div className="col-span-2">
                <Button size="sm" onClick={handleAdd} disabled={!newMatId || !newQty} className="w-full h-8 gap-1">
                  <Plus className="h-3 w-3" />
                  Aggiungi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const ComponentRow: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comp: any;
  onUpdate: (qty: number) => void;
  onDelete: () => void;
}> = ({ comp, onUpdate, onDelete }) => {
  const [qtyDraft, setQtyDraft] = useState<string>('');
  const mat = comp.material;

  const handleBlur = () => {
    if (!qtyDraft) return;
    const v = Number(qtyDraft.replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) return;
    if (v === comp.quantity_per_sqm) {
      setQtyDraft('');
      return;
    }
    onUpdate(v);
    setQtyDraft('');
  };

  const unitPrice = Number(mat?.unit_price ?? 0);
  const unit = String(mat?.unit ?? '').toLowerCase().trim();
  const box = Number(mat?.box_pieces ?? 0);
  const pricePerUsage = (unit === 'scatola' && box > 0) ? unitPrice / box : unitPrice;
  const rowCost = comp.quantity_per_sqm * pricePerUsage;

  return (
    <li className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded bg-zinc-50 border text-xs">
      <div className="col-span-6 truncate">
        <div className="font-medium truncate">{mat?.name ?? '(materiale eliminato)'}</div>
        <div className="text-[10px] text-muted-foreground">
          {mat?.code && `Cod: ${mat.code}`} {mat?.supplier && `· ${mat.supplier}`}
        </div>
      </div>
      <div className="col-span-3 flex items-center gap-1">
        <Input
          type="number"
          step="0.001"
          value={qtyDraft || String(comp.quantity_per_sqm)}
          onChange={(e) => setQtyDraft(e.target.value)}
          onBlur={handleBlur}
          className="h-7 text-xs text-right"
        />
        <span className="text-[10px] text-muted-foreground shrink-0">{mat?.unit ?? ''}/m²</span>
      </div>
      <div className="col-span-2 text-right font-mono text-muted-foreground">
        €{rowCost.toFixed(3)}/m²
      </div>
      <div className="col-span-1 text-right">
        <Button size="icon" variant="ghost" onClick={onDelete} className="h-6 w-6 text-destructive hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </li>
  );
};

export default FinishLevelsCard;
