
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CertifiedStratigraphyFormData } from '@/types/certification';
import { getWallTypeLabel, getWallTypeDescription } from '../utils/wallTypeDetection';

interface CertificationGeneralFormProps {
  formData: CertifiedStratigraphyFormData;
  onFormChange: (field: keyof CertifiedStratigraphyFormData, value: any) => void;
}

const CertificationGeneralForm = ({ formData, onFormChange }: CertificationGeneralFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Certificazione *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="Es. Parete REI 60 - Sol. 123"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution-number">Numero Soluzione *</Label>
            <Input
              id="solution-number"
              value={formData.solution_number}
              onChange={(e) => onFormChange('solution_number', e.target.value)}
              placeholder="Es. 123"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrizione</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            placeholder="Descrizione tecnica della stratigrafia..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipologia (Determinata Automaticamente)</Label>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
            <Badge variant="outline" className="text-xs">
              {getWallTypeLabel(formData.type)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getWallTypeDescription(formData.type)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            La tipologia viene calcolata automaticamente in base ai materiali aggiunti nella composizione.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationGeneralForm;
