
import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialFormData } from './MaterialFormData';
import { applyCumulativeDiscounts, validateDiscountString } from '@/utils/discountUtils';

interface MaterialPricingSectionProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const MaterialPricingSection = ({ formData, setFormData, isSubmitting }: MaterialPricingSectionProps) => {
  // Calcola automaticamente il prezzo finale quando cambiano prezzo di listino, sconto, sfrido e discarica
  useEffect(() => {
    const listPrice = parseFloat(formData.list_price || '0');
    const discount = formData.discount?.trim();
    const wastePercentage = parseFloat(formData.waste_percentage || '0');
    const disposalPercentage = parseFloat(formData.disposal_percentage || '0');
    
    if (listPrice > 0) {
      let finalPrice = listPrice;
      
      // Applica gli sconti se presenti
      if (discount && validateDiscountString(discount)) {
        finalPrice = applyCumulativeDiscounts(listPrice, discount);
      }
      
      // Aggiungi sfrido e discarica
      const wasteAmount = (finalPrice * wastePercentage) / 100;
      const disposalAmount = (finalPrice * disposalPercentage) / 100;
      finalPrice = finalPrice + wasteAmount + disposalAmount;
      
      // Per le viti, usa 4 decimali, per altri materiali 2 decimali
      const decimals = formData.category === 'screw' ? 4 : 2;
      setFormData(prev => ({ 
        ...prev, 
        unit_price: finalPrice.toFixed(decimals)
      }));
    }
  }, [formData.list_price, formData.discount, formData.waste_percentage, formData.disposal_percentage, formData.category, setFormData]);

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

        <div>
          <Label htmlFor="discount">Sconto (cumulativo)</Label>
          <Input
            id="discount"
            type="text"
            value={formData.discount}
            onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
            disabled={isSubmitting}
            placeholder="50+25+5"
            className={formData.discount && !validateDiscountString(formData.discount) ? 'border-red-500' : ''}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Inserisci gli sconti separati da +. Esempio: 50+25+5 per sconti del 50%, poi 25%, poi 5%
          </p>
          {formData.discount && !validateDiscountString(formData.discount) && (
            <p className="text-sm text-red-500 mt-1">
              Formato sconto non valido
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="waste_percentage">Sfrido (%) *</Label>
          <Input
            id="waste_percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.waste_percentage}
            onChange={(e) => setFormData(prev => ({ ...prev, waste_percentage: e.target.value }))}
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Percentuale di sfrido da aggiungere al prezzo scontato
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
