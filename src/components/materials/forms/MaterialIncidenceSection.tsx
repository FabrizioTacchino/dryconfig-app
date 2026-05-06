
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialFormData } from './MaterialFormData';
import { MaterialCategory } from '@/types';
import { Calculator, Target } from 'lucide-react';

interface MaterialIncidenceSectionProps {
  formData: MaterialFormData;
  onChange: (field: keyof MaterialFormData, value: string) => void;
}

const MaterialIncidenceSection = ({ formData, onChange }: MaterialIncidenceSectionProps) => {
  const calculateIncidenceForStructure = () => {
    const incidenceBase = parseFloat(formData.incidence_base) || 0;
    const passo = parseFloat(formData.passo) || 600;
    return incidenceBase * (600 / passo);
  };

  const getIncidenceDescription = () => {
    switch (formData.category) {
      case 'board':
        return 'Per le lastre, l\'incidenza è sempre 1 m²/m²';
      case 'structure_frame':
        return 'Per i montanti, l\'incidenza dipende dal passo di installazione';
      case 'structure_guide':
        return 'Per le guide, l\'incidenza dipende dal passo di installazione (default 0.7)';
      case 'accessory':
        return 'Per gli accessori, specificare il numero di pezzi per m²';
      default:
        return 'Quantità di materiale necessaria per 1 m² di parete';
    }
  };

  const handleIncidenceBaseChange = (value: string) => {
    onChange('incidence_base', value);
    // Auto-calculate incidence_per_sqm for structure materials
    if (formData.category === 'structure_frame' || formData.category === 'structure_guide') {
      const incidenceBase = parseFloat(value) || 0;
      const passo = parseFloat(formData.passo) || 600;
      const calculated = incidenceBase * (600 / passo);
      onChange('incidence_per_sqm', calculated.toString());
    }
  };

  const handlePassoChange = (value: string) => {
    onChange('passo', value);
    // Auto-calculate incidence_per_sqm for structure materials
    if (formData.category === 'structure_frame' || formData.category === 'structure_guide') {
      const incidenceBase = parseFloat(formData.incidence_base) || 0;
      const passo = parseFloat(value) || 600;
      const calculated = incidenceBase * (600 / passo);
      onChange('incidence_per_sqm', calculated.toString());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Incidenza per Metro Quadro
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getIncidenceDescription()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.category === 'board' && (
          <div>
            <Label htmlFor="incidence_per_sqm">Incidenza (m²/m²)</Label>
            <Input
              id="incidence_per_sqm"
              type="number"
              value="1"
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              L'incidenza per le lastre è sempre 1
            </p>
          </div>
        )}

        {(formData.category === 'structure_frame' || formData.category === 'structure_guide') && (
          <>
            <div>
              <Label htmlFor="incidence_base">Incidenza Base (a 600mm)</Label>
              <Input
                id="incidence_base"
                type="number"
                step="0.01"
                value={formData.incidence_base}
                onChange={(e) => handleIncidenceBaseChange(e.target.value)}
                placeholder={formData.category === 'structure_guide' ? "0.7" : "1.8"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Incidenza di riferimento con passo a 600mm
                {formData.category === 'structure_guide' && ' (default 0.7 per le guide)'}
              </p>
            </div>

            <div>
              <Label htmlFor="passo">Passo Standard (mm)</Label>
              <Input
                id="passo"
                type="number"
                value={formData.passo}
                onChange={(e) => handlePassoChange(e.target.value)}
                placeholder="600"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Distanza standard tra {formData.category === 'structure_frame' ? 'i montanti' : 'le guide'}
              </p>
            </div>

            <div>
              <Label htmlFor="incidence_per_sqm" className="flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                Incidenza Calcolata
              </Label>
              <Input
                id="incidence_per_sqm"
                type="number"
                step="0.01"
                value={formData.incidence_per_sqm}
                onChange={(e) => onChange('incidence_per_sqm', e.target.value)}
                placeholder="Calcolata automaticamente"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valore calcolato: {calculateIncidenceForStructure().toFixed(3)} ml/m²
              </p>
            </div>
          </>
        )}

        {formData.category !== 'board' && formData.category !== 'structure_frame' && formData.category !== 'structure_guide' && (
          <div>
            <Label htmlFor="incidence_per_sqm">Incidenza per m²</Label>
            <Input
              id="incidence_per_sqm"
              type="number"
              step="0.01"
              value={formData.incidence_per_sqm}
              onChange={(e) => onChange('incidence_per_sqm', e.target.value)}
              placeholder="1.0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quantità necessaria per coprire 1 m² di parete
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialIncidenceSection;
