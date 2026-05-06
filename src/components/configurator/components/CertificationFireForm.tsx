
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertifiedStratigraphyFormData } from '@/types/certification';

interface CertificationFireFormProps {
  formData: CertifiedStratigraphyFormData;
  onFormChange: (field: keyof CertifiedStratigraphyFormData, value: any) => void;
}

const CertificationFireForm = ({ formData, onFormChange }: CertificationFireFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resistenza al Fuoco</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fire-resistance">Resistenza al Fuoco *</Label>
            <Select value={formData.fire_resistance} onValueChange={(value) => onFormChange('fire_resistance', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EI 30">EI 30</SelectItem>
                <SelectItem value="EI 60">EI 60</SelectItem>
                <SelectItem value="EI 90">EI 90</SelectItem>
                <SelectItem value="EI 120">EI 120</SelectItem>
                <SelectItem value="EI 180">EI 180</SelectItem>
                <SelectItem value="EI 240">EI 240</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-height">Altezza Massima (m)</Label>
            <Input
              id="max-height"
              type="number"
              step="0.1"
              value={formData.max_height || ''}
              onChange={(e) => onFormChange('max_height', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Es. 4.5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fire-test-report">Rapporto Prova Classificazione Fuoco</Label>
          <Input
            id="fire-test-report"
            value={formData.fire_test_report_code || ''}
            onChange={(e) => onFormChange('fire_test_report_code', e.target.value)}
            placeholder="Es. LAPI-FT-2024-001"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationFireForm;
