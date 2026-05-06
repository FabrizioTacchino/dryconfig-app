
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertifiedStratigraphyFormData } from '@/types/certification';

interface CertificationCurvatureFormProps {
  formData: CertifiedStratigraphyFormData;
  onFormChange: (field: keyof CertifiedStratigraphyFormData, value: any) => void;
}

const CertificationCurvatureForm = ({ formData, onFormChange }: CertificationCurvatureFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Curvatura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="curvature-radius">Raggio di Curvatura (mm)</Label>
            <Input
              id="curvature-radius"
              type="number"
              step="0.1"
              value={formData.curvature_radius || ''}
              onChange={(e) => onFormChange('curvature_radius', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Es. 1000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="curvature-description">Descrizione Raggio di Curvatura</Label>
            <Input
              id="curvature-description"
              value={formData.curvature_radius_description || ''}
              onChange={(e) => onFormChange('curvature_radius_description', e.target.value)}
              placeholder="Es. Curvatura minima consentita"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationCurvatureForm;
