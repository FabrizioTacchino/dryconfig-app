
import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MaterialFormData } from './MaterialFormData';
import { useWasteFactors } from '@/hooks/useWasteFactors';

interface MaterialPricingSectionProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const MaterialPricingSection = ({ formData, setFormData, isSubmitting }: MaterialPricingSectionProps) => {
  // Catena famiglia (read-only, viene dalla view materials_with_pricing al load)
  const familyChainStr = (formData as any).family_discount_chain_display ?? ''; // es. "50 + 54.5"
  const familyPctStr   = (formData as any).family_discount_pct_display ?? '0';
  const familyPct      = parseFloat(familyPctStr) || 0;
  const familyFactor   = 1 - familyPct / 100;

  // Sconto extra prodotto editabile
  const extraPct = useMemo(() => {
    const v = parseFloat(formData.extra_discount || '0');
    return Number.isFinite(v) && v >= 0 && v < 100 ? v : 0;
  }, [formData.extra_discount]);

  // Calcolo unit_price (netto) live a partire da list_price, catena famiglia e extra_discount
  // Sfrido/discarica non si applicano qui — sono fattori di consumo per m², non di prezzo unitario.
  useEffect(() => {
    const listPrice = parseFloat(formData.list_price || '0');
    if (listPrice > 0) {
      const finalPrice = listPrice * familyFactor * (1 - extraPct / 100);
      const decimals = formData.category === 'screw' ? 4 : 2;
      setFormData(prev => ({ ...prev, unit_price: finalPrice.toFixed(decimals) }));
    }
  }, [formData.list_price, familyFactor, extraPct, formData.category, setFormData]);

  const totalPct = (1 - familyFactor * (1 - extraPct / 100)) * 100;
  const hasFamily = familyPct > 0.001;

  // Default sfrido per categoria (Settings → Sfridi). Mostrato come placeholder
  // quando il campo è vuoto (= "usa categoria").
  const { wasteMap } = useWasteFactors();
  const categoryWasteDefault = wasteMap[formData.category ?? ''] ?? 0;

  // Determina il numero di decimali da mostrare
  const getStepValue = () => {
    return formData.category === 'screw' ? '0.0001' : '0.01';
  };

  // Determina il numero di decimali per la visualizzazione
  const getDecimalPlaces = () => {
    return formData.category === 'screw' ? 4 : 2;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">💰 Prezzi e Tempi</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="list_price">Prezzo di listino (€) *</Label>
          <Input
            id="list_price"
            type="number"
            step={getStepValue()}
            min="0"
            value={formData.list_price}
            onChange={(e) => setFormData(prev => ({ ...prev, list_price: e.target.value }))}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="col-span-2 rounded-md border border-blue-200 bg-blue-50/40 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium text-blue-900">Sconto famiglia (catena cumulativa)</Label>
            <Link to="/settings/suppliers" className="text-xs text-blue-700 hover:underline">
              Modifica in /settings/suppliers →
            </Link>
          </div>
          {hasFamily ? (
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="bg-white border-blue-200 font-mono">
                {familyChainStr || `${familyPct.toFixed(2)}%`}
              </Badge>
              <span className="text-blue-900">→ paghi <strong>{(100 - familyPct).toFixed(2)}%</strong> del listino</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nessuno sconto famiglia attivo per la tua organizzazione.</div>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="extra_discount">Sconto extra prodotto (%)</Label>
          <Input
            id="extra_discount"
            type="number"
            min="0"
            max="99.99"
            step="0.01"
            value={formData.extra_discount}
            onChange={(e) => setFormData(prev => ({ ...prev, extra_discount: e.target.value }))}
            disabled={isSubmitting}
            placeholder="0"
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Eventuale sconto aggiuntivo per <em>questo prodotto</em>, applicato dopo la catena famiglia.
            Lascia <code>0</code> se vale solo lo sconto famiglia.
          </p>
          {extraPct > 0 && (
            <p className="text-xs text-blue-700 mt-1">
              Sconto totale combinato: <strong>{totalPct.toFixed(2)}%</strong> · paghi {(100 - totalPct).toFixed(2)}% del listino
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="waste_percentage">Sfrido (%)</Label>
          <Input
            id="waste_percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.waste_percentage ?? ''}
            onChange={(e) => setFormData(prev => ({ ...prev, waste_percentage: e.target.value }))}
            disabled={isSubmitting}
            placeholder={`Default categoria: ${categoryWasteDefault}%`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Vuoto = usa il default della categoria (configurabile in <Link to="/settings" className="underline">Impostazioni → Sfridi</Link>).
            Compila qui solo per sovrascrivere il default su questo materiale.
          </p>
        </div>

        <div>
          <Label htmlFor="disposal_percentage">Discarica (%) *</Label>
          <Input
            id="disposal_percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.disposal_percentage}
            onChange={(e) => setFormData(prev => ({ ...prev, disposal_percentage: e.target.value }))}
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Percentuale di discarica da aggiungere al prezzo scontato
          </p>
        </div>

        <div>
          <Label htmlFor="unit_price">Prezzo finale (€) *</Label>
          <Input
            id="unit_price"
            type="number"
            step={getStepValue()}
            min="0"
            value={formData.unit_price}
            onChange={(e) => {
              const value = e.target.value;
              // Se l'utente modifica manualmente, mantieni il valore così com'è
              // ma assicurati che sia formattato correttamente quando perde il focus
              setFormData(prev => ({ ...prev, unit_price: value }));
            }}
            onBlur={(e) => {
              const value = parseFloat(e.target.value || '0');
              if (!isNaN(value)) {
                const decimals = getDecimalPlaces();
                setFormData(prev => ({ ...prev, unit_price: value.toFixed(decimals) }));
              }
            }}
            disabled={isSubmitting}
            required
            className="bg-gray-50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Calcolato automaticamente da: Listino → Sconti → + Sfrido → + Discarica
            {formData.category === 'screw' && <span className="block">Visualizzazione con 4 decimali per le viti</span>}
          </p>
        </div>

        <div>
          <Label htmlFor="unit">Unità di misura *</Label>
          <select
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md"
            disabled={isSubmitting}
            required
          >
            <option value="mq">mq - Metro quadro</option>
            <option value="ml">ml - Metro lineare</option>
            <option value="pz">pz - Pezzo</option>
            <option value="kg">kg - Chilogrammo</option>
            <option value="lt">lt - Litro</option>
          </select>        
        </div>

        <div className="col-span-2">
          <Label htmlFor="installation_time_per_sqm">Tempo di posa (minuti per {formData.unit}) *</Label>
          <Input
            id="installation_time_per_sqm"
            type="number"
            step="0.0001"
            min="0"
            value={formData.installation_time_per_sqm}
            onChange={(e) => setFormData(prev => ({ ...prev, installation_time_per_sqm: e.target.value }))}
            disabled={isSubmitting}
            required
            placeholder="Inserisci il tempo di posa in minuti (es. 0.0278 per 36 viti/min)"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Tempo stimato per installare una unità di questo materiale. Puoi usare fino a 4 decimali per precisione maggiore.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialPricingSection;
