import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Card Settings → Costo orario manodopera.
 *
 * Sostituisce la pagina /admin → tab Configuratore → LaborSettings.
 *
 * Read/write su `configurator_settings.cost_per_hour`. Al salvataggio
 * invalida TUTTE le query React-Query che leggono il valore, così il
 * configuratore e il preventivo si aggiornano subito.
 *
 * Bug fix: prima del refactor, il valore veniva salvato ma non si
 * propagava nel preview costi (cache stale). Ora invalidiamo:
 *   - ['cost_per_hour']             (useStratigraphyCosts)
 *   - ['cost_per_hour-add-dialog']  (AddToEstimateDialogV2)
 *   - ['cost_per_hour-finish-levels'] (FinishLevelsCard)
 */
const COST_PER_HOUR_QUERY_KEYS = [
  ['cost_per_hour'],
  ['cost_per_hour-add-dialog'],
  ['cost_per_hour-finish-levels'],
];

const LaborCostCard: React.FC = () => {
  const queryClient = useQueryClient();
  const [costPerHour, setCostPerHour] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('configurator_settings')
      .select('value')
      .eq('key', 'cost_per_hour')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCostPerHour(data?.value ?? '30');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    const value = costPerHour.trim();
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      toast.error('Inserisci un valore valido (€/h positivo)');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('configurator_settings')
        .upsert([{ key: 'cost_per_hour', value }], { onConflict: 'key' });
      if (error) throw error;
      // Invalida tutte le query che leggono cost_per_hour così il
      // configuratore e i preventivi vedono il nuovo valore subito.
      for (const key of COST_PER_HOUR_QUERY_KEYS) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      toast.success(`Costo orario aggiornato a €${value}/h`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Costo orario manodopera
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Tariffa €/ora usata per calcolare il costo manodopera nelle stratigrafie e nei preventivi.
          Modificarla aggiorna immediatamente tutti i preview di costo. I preventivi già salvati
          si aggiornano cliccando <strong>"Aggiorna prezzi"</strong> sul singolo preventivo.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 max-w-sm">
          <div className="flex-1">
            <Label htmlFor="cost-per-hour">Costo €/h</Label>
            <Input
              id="cost-per-hour"
              type="number"
              min="0"
              step="0.5"
              value={costPerHour}
              onChange={(e) => setCostPerHour(e.target.value)}
              disabled={loading}
              placeholder="30"
            />
          </div>
          <Button onClick={handleSave} disabled={loading || saving || !costPerHour.trim()}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LaborCostCard;
