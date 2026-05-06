
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertifiedStratigraphyFormData } from '@/types/certification';

interface CertificationBreakResistanceFormProps {
  formData: CertifiedStratigraphyFormData;
  onFormChange: (field: keyof CertifiedStratigraphyFormData, value: any) => void;
}

const CertificationBreakResistanceForm = ({ formData, onFormChange }: CertificationBreakResistanceFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resistenza all'Effrazione</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="break-resistance">Resistenza Effrazione</Label>
            <Input
              id="break-resistance"
              value={formData.break_resistance || ''}
              onChange={(e) => onFormChange('break_resistance', e.target.value)}
              placeholder="Es. Classe A1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="break-resistance-report">Codice Rapporto Resistenza Effrazione</Label>
            <Input
              id="break-resistance-report"
              value={formData.break_resistance_report_code || ''}
              onChange={(e) => onFormChange('break_resistance_report_code', e.target.value)}
              placeholder="Es. LAPI-BR-2024-001"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="break-resistance-notes">Note Resistenza Effrazione</Label>
          <Textarea
            id="break-resistance-notes"
            value={formData.break_resistance_notes || ''}
            onChange={(e) => onFormChange('break_resistance_notes', e.target.value)}
            placeholder="Note aggiuntive sulla resistenza all'effrazione..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationBreakResistanceForm;
