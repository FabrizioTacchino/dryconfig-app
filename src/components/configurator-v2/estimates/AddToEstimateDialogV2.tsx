import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lock, AlertTriangle, FilePlus2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useEstimates } from '@/hooks/useEstimates';
import { useCreateEstimateStratigraphy } from '@/hooks/useCreateEstimateStratigraphy';
import { useEstimateStratigraphiesQuery } from '@/hooks/useEstimateStratigraphiesQuery';
import { useFinishLevels, computeFinishLevelCost } from '@/hooks/useFinishLevels';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AddToEstimateDialogV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ID stratigrafia salvata. Senza ID il dialog non si può usare (chiede di salvare prima). */
  stratigraphyId: string | null;
  /** Nome corrente, usato come default per il campo nome. */
  stratigraphyName: string;
  /** Descrizione corrente. */
  stratigraphyDescription?: string;
  /** Costo €/m² calcolato della stratigrafia, usato per il preview. */
  costPerSqm: number;
  /** Se valorizzato, preseleziona questo preventivo (es. quando si è entrati con `?estimate=...`). */
  preselectedEstimateId?: string | null;
  /** Callback chiamato quando la stratigrafia viene aggiunta con successo. Riceve l'estimateId. */
  onAdded?: (estimateId: string) => void;
}

/**
 * Dialog "Aggiungi al preventivo" V2.
 *
 * Versione compatta del dialog di V1: niente calcolo complesso degli accessori,
 * niente preview lista materiali (lo lasciamo nella scheda preventivo).
 * Qui chiediamo solo: preventivo · superficie · altezza · livello finitura · nome.
 */
const AddToEstimateDialogV2: React.FC<AddToEstimateDialogV2Props> = ({
  open,
  onOpenChange,
  stratigraphyId,
  stratigraphyName,
  stratigraphyDescription,
  costPerSqm,
  preselectedEstimateId,
  onAdded,
}) => {
  const { estimates } = useEstimates();
  const { createEstimateStratigraphy, isCreating } = useCreateEstimateStratigraphy();
  const { data: finishLevels = [] } = useFinishLevels();
  const { data: hourlyRate = 30 } = useQuery({
    queryKey: ['cost_per_hour-add-dialog'],
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

  const [estimateId, setEstimateId] = useState<string>('');
  const [name, setName] = useState(stratigraphyName);
  const [description, setDescription] = useState(stratigraphyDescription ?? '');
  const [area, setArea] = useState<number>(10);
  const [wallHeight, setWallHeight] = useState<number>(2.7);
  const [finishLevel, setFinishLevel] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const { estimateStratigraphies } = useEstimateStratigraphiesQuery(estimateId);

  // Reset / preseleziona quando il dialog si apre
  useEffect(() => {
    if (!open) return;
    setName(stratigraphyName);
    setDescription(stratigraphyDescription ?? '');
    if (preselectedEstimateId) setEstimateId(preselectedEstimateId);
    setShowDuplicateWarning(false);
  }, [open, stratigraphyName, stratigraphyDescription, preselectedEstimateId]);

  const selectedEstimate = useMemo(
    () => estimates.find((e: any) => e.id === estimateId),
    [estimates, estimateId],
  );
  const isContracted = selectedEstimate?.status === 'contracted';
  const isDuplicate = useMemo(() => {
    if (!estimateId || !stratigraphyId) return false;
    return (estimateStratigraphies ?? []).some(
      (es: any) => es.stratigraphyId === stratigraphyId,
    );
  }, [estimateStratigraphies, estimateId, stratigraphyId]);

  // F7.7/F7.8: costo finitura del livello selezionato per il preview live
  // F20.7: arrotonda unit_cost a 2 decimali PRIMA di calcolare il totale,
  // identico al bulk update. Senza questo, preview e "Aggiorna prezzi"
  // divergono per centesimi (arrotondamento full-precision vs 2 decimali).
  const selectedFinishLevel = finishLevels.find(l => l.code === finishLevel);
  const finishCost = selectedFinishLevel
    ? computeFinishLevelCost(selectedFinishLevel, hourlyRate).totalCost
    : 0;
  const unitCostWithFinish = Math.round((costPerSqm + finishCost) * 100) / 100;
  const totalCost = Math.round(unitCostWithFinish * area * 100) / 100;

  const submit = () => {
    if (!stratigraphyId) {
      toast.error('Salva la stratigrafia prima di aggiungerla a un preventivo.');
      return;
    }
    if (!estimateId) {
      toast.error('Seleziona un preventivo.');
      return;
    }
    if (isContracted) {
      toast.error('Il preventivo è contrattualizzato: non si possono aggiungere stratigrafie.');
      return;
    }
    if (isDuplicate && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }

    createEstimateStratigraphy(
      {
        estimateId,
        stratigraphyId,
        name: name.trim() || stratigraphyName,
        description: description.trim() || undefined,
        area,
        quantity: 1,
        unitCost: costPerSqm,
        totalCost,
        finishLevel,
        wallHeight,
      },
      {
        onSuccess: () => {
          toast.success('Stratigrafia aggiunta al preventivo.');
          onAdded?.(estimateId);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-primary" />
            Aggiungi al preventivo
          </DialogTitle>
          <DialogDescription>
            Inserisci la stratigrafia in un preventivo specificando metratura e dettagli del cantiere.
          </DialogDescription>
        </DialogHeader>

        {!stratigraphyId ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Devi <strong>salvare la stratigrafia</strong> prima di poterla aggiungere a un preventivo.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Preventivo */}
            <div className="space-y-1.5">
              <Label htmlFor="est">Preventivo</Label>
              <Select value={estimateId} onValueChange={setEstimateId}>
                <SelectTrigger id="est">
                  <SelectValue placeholder="Seleziona un preventivo…" />
                </SelectTrigger>
                <SelectContent>
                  {(estimates ?? []).map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">
                          {e.projectName ? `${e.projectName} — ${e.name}` : e.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {e.status}
                        </Badge>
                        {e.status === 'contracted' && <Lock className="h-3 w-3 text-red-600 shrink-0" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isContracted && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Preventivo <strong>contrattualizzato</strong>: non puoi aggiungere stratigrafie.
                </AlertDescription>
              </Alert>
            )}

            {showDuplicateWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Stratigrafia <strong>già presente</strong> nel preventivo. Clicca di nuovo "Conferma" per
                  aggiungerla comunque (es. se è una zona diversa del cantiere).
                </AlertDescription>
              </Alert>
            )}

            {/* Nome custom + descrizione */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome (per questo preventivo)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={stratigraphyName}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Note</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Es. zona uffici 2° piano"
              />
            </div>

            {/* Metratura · altezza · finitura */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="area">Superficie (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  min="0"
                  value={area}
                  onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="height">Altezza (m)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label htmlFor="finish">Livello finitura</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="Info livelli finitura" className="text-muted-foreground hover:text-foreground">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-xs space-y-2">
                      <div className="font-semibold text-sm">Livelli finitura UNI 11424:2015</div>
                      <div><strong>Q1 — Base</strong>: stuccatura giunti, protezione spigoli. Per intercapedini, locali tecnici, zone occultate.</div>
                      <div><strong>Q2 — Standard</strong>: Q1 + finitura giunti e teste viti. Adatto a pitture opache normali (default).</div>
                      <div><strong>Q3 — Superiore</strong>: Q2 + rasatura sottile su tutta la superficie. Per pitture lucide, satinate, rivestimenti decorativi.</div>
                      <div><strong>Q4 — Specchio</strong>: Q3 + 2 mani rasatura fine. Per finiture decorative lisce (es. veneziano) e luce radente.</div>
                      <div className="pt-1 text-muted-foreground border-t">
                        Modifica componenti e tempi in <span className="font-medium">Impostazioni → Livelli di finitura</span>.
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Select value={finishLevel} onValueChange={(v) => setFinishLevel(v as any)}>
                  <SelectTrigger id="finish">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1 base</SelectItem>
                    <SelectItem value="Q2">Q2 standard</SelectItem>
                    <SelectItem value="Q3">Q3 alta qualità</SelectItem>
                    <SelectItem value="Q4">Q4 specchio</SelectItem>
                  </SelectContent>
                </Select>
                {finishCost > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    +€{finishCost.toFixed(2)}/m² per finitura {finishLevel}
                  </div>
                )}
              </div>
            </div>

            {/* Preview costi */}
            <div className="rounded-md border bg-zinc-50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Costo parete</span>
                <span className="font-mono">€{costPerSqm.toFixed(2)} /m²</span>
              </div>
              {finishCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Finitura {finishLevel}</span>
                  <span className="font-mono">+€{finishCost.toFixed(2)} /m²</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-1 border-t border-zinc-200">
                <span>Unitario totale</span>
                <span className="font-mono">€{unitCostWithFinish.toFixed(2)} /m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Superficie</span>
                <span className="font-mono">{area.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200">
                <span className="font-semibold">Totale</span>
                <span className="font-mono font-bold text-zinc-900">€{totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                Annulla
              </Button>
              <Button onClick={submit} disabled={isCreating || isContracted}>
                {isCreating ? 'Aggiungo…' : 'Conferma'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToEstimateDialogV2;
