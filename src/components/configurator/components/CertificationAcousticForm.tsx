
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertifiedStratigraphyFormData } from '@/types/certification';

interface CertificationAcousticFormProps {
  formData: CertifiedStratigraphyFormData;
  onFormChange: (field: keyof CertifiedStratigraphyFormData, value: any) => void;
}

const CertificationAcousticForm = ({ formData, onFormChange }: CertificationAcousticFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acustica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="acoustic-reduction">Abbattimento Acustico (dB)</Label>
            <Input
              id="acoustic-reduction"
              type="number"
              value={formData.acoustic_reduction || ''}
              onChange={(e) => onFormChange('acoustic_reduction', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Es. 42"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acoustic-report">Rapporto Prova Abbattimento Acustico</Label>
            <Input
              id="acoustic-report"
              value={formData.acoustic_report_code || ''}
              onChange={(e) => onFormChange('acoustic_report_code', e.target.value)}
              placeholder="Es. LAPI-AC-2024-001"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationAcousticForm;
