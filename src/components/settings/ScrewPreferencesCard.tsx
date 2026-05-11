import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Wrench, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMaterials, type DatabaseMaterial } from '@/hooks/useMaterials';
import {
  useScrewPreferences,
  useUpsertScrewPreference,
  useDeleteScrewPreference,
} from '@/hooks/useScrewPreferences';
import type { ScrewLengthRule } from '@/components/configurator-v2/hooks/screwRecommendation';

const BOARD_LABELS: Record<string, string> = {
  gesso_rivestito: 'Gesso rivestito',
  gessofibra: 'Gessofibra (Fermacell/Rigidur)',
  cemento_fibroarmato: 'Cementizia (Aquaroc/Aquapanel)',
  silicato: 'Silicato di calcio',
};

const SUPPORT_LABELS: Record<string, string> = {
  metal_thin: 'lamiera sottile (<0,7 mm)',
  metal_thick: 'lamiera spessa (≥0,7 mm)',
  wood: 'legno',
};

const AUTO_SENTINEL = '__auto__';

const ScrewPreferencesCard: React.FC = () => {
  const { data: rules = [], isLoading: rulesLoading } = useQuery<ScrewLengthRule[]>({
    queryKey: ['screw_length_rules'],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('screw_length_rules' as never)
        .select('*');
      if (error) throw error;
      return (data as unknown as ScrewLengthRule[]) ?? [];
    },
  });

  const { data: allMaterials = [] } = useMaterials();
  const { preferences, isLoading: prefsLoading } = useScrewPreferences();
  const upsert = useUpsertScrewPreference();
  const remove = useDeleteScrewPreference();

  const allScrews = useMemo<DatabaseMaterial[]>(
    () => allMaterials.filter(m => m.category === 'screw'),
    [allMaterials],
  );

  // Raggruppa regole per board_type, ordina per supporto e poi per range spessore
  const rulesByBoard = useMemo(() => {
    const groups = new Map<string, ScrewLengthRule[]>();
    const sorted = [...rules].sort((a, b) => {
      if (a.board_type !== b.board_type) return a.board_type.localeCompare(b.board_type);
      if (a.support_type !== b.support_type) return a.support_type.localeCompare(b.support_type);
      return Number(a.min_total_thickness_mm) - Number(b.min_total_thickness_mm);
    });
    for (const r of sorted) {
      const arr = groups.get(r.board_type) ?? [];
      arr.push(r);
      groups.set(r.board_type, arr);
    }
    return groups;
  }, [rules]);

  const prefByRuleId = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const p of preferences) {
      if (p.priority === 1) m.set(p.length_rule_id, p.preferred_material_id);
    }
    return m;
  }, [preferences]);

  const handleChange = (rule: ScrewLengthRule, value: string) => {
    if (value === AUTO_SENTINEL) {
      remove.mutate({ length_rule_id: rule.id, priority: 1 });
      return;
    }
    upsert.mutate({
      length_rule_id: rule.id,
      preferred_material_id: value,
      priority: 1,
    });
  };

  if (rulesLoading || prefsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Auto-assegnazione viti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Caricamento regole…</div>
        </CardContent>
      </Card>
    );
  }

  const boardOrder = ['gesso_rivestito', 'gessofibra', 'cemento_fibroarmato', 'silicato'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Auto-assegnazione viti
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Scegli la <strong>vite preferita</strong> per ciascuna combinazione lastra + supporto + spessore.
          Quando configuri una stratigrafia, il sistema proporrà la tua vite. Se non scegli nulla, usa il default di catalogo.
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {boardOrder.filter(b => rulesByBoard.has(b)).map(boardType => {
            const boardRules = rulesByBoard.get(boardType) ?? [];
            const compatibleScrews = allScrews.filter(s =>
              Array.isArray(s.compatible_board_types) &&
              s.compatible_board_types.includes(boardType),
            );
            const customCount = boardRules.filter(r => prefByRuleId.has(r.id)).length;

            return (
              <AccordionItem key={boardType} value={boardType}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span>{BOARD_LABELS[boardType] ?? boardType}</span>
                    <Badge variant="outline" className="text-xs">
                      {boardRules.length} regole
                    </Badge>
                    {customCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {customCount} personalizzate
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {compatibleScrews.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Nessuna vite compatibile in catalogo per <strong>{BOARD_LABELS[boardType]}</strong>.
                      Importa un listino con viti adatte oppure verifica il campo <code>compatible_board_types</code>.
                    </div>
                  )}
                  <div className="space-y-2">
                    {boardRules.map(rule => {
                      const currentPref = prefByRuleId.get(rule.id);
                      const isOrphan = prefByRuleId.has(rule.id) && currentPref === null;
                      // Per il dropdown filtriamo per length sufficiente alla regola
                      const eligible = compatibleScrews.filter(s =>
                        Number(s.length ?? 0) >= rule.recommended_length_mm,
                      );
                      const systemSuggestionCode = rule.preferred_codes?.[0] ?? null;
                      const selectedValue = currentPref ?? AUTO_SENTINEL;

                      return (
                        <div key={rule.id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">
                              {Number(rule.min_total_thickness_mm)}–{Number(rule.max_total_thickness_mm)} mm
                              <span className="text-muted-foreground font-normal ml-2">
                                · {SUPPORT_LABELS[rule.support_type] ?? rule.support_type}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Lunghezza raccomandata: <strong>{rule.recommended_length_mm} mm</strong>
                              {systemSuggestionCode && (
                                <> · default catalogo: <code className="text-xs">{systemSuggestionCode}</code></>
                              )}
                              {rule.notes && <> · {rule.notes}</>}
                            </div>
                          </div>
                          <div className="w-72 shrink-0">
                            <Select
                              value={selectedValue}
                              onValueChange={(v) => handleChange(rule, v)}
                              disabled={upsert.isPending || remove.isPending || eligible.length === 0}
                            >
                              <SelectTrigger className={isOrphan ? 'border-amber-400' : ''}>
                                <SelectValue placeholder={eligible.length === 0 ? 'Nessuna vite eligibile' : 'Scegli vite preferita'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={AUTO_SENTINEL}>
                                  Auto (default catalogo)
                                </SelectItem>
                                {eligible.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.code} · {s.name} ({Number(s.length ?? 0)} mm)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isOrphan && (
                              <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Preferenza precedente non più in catalogo
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ScrewPreferencesCard;
