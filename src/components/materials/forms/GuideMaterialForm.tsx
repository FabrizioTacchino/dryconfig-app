
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MaterialFormData, profileTypeOptions, surfaceFinishOptions } from './MaterialFormData';
import MaterialIncidenceSection from './MaterialIncidenceSection';
import MaterialPricingSection from './MaterialPricingSection';

interface GuideMaterialFormProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const GuideMaterialForm = ({ formData, setFormData, isSubmitting }: GuideMaterialFormProps) => {
  const handleChange = (field: keyof MaterialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* 📁 Identificativi generali */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📁 Identificativi generali</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Codice *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="supplier">Fornitore *</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleChange('supplier', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="color_hex">Colore (per preview)</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color_hex"
                type="color"
                value={formData.color_hex}
                onChange={(e) => handleChange('color_hex', e.target.value)}
                disabled={isSubmitting}
                className="w-16 h-10 p-1 rounded"
              />
              <Input
                value={formData.color_hex}
                onChange={(e) => handleChange('color_hex', e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
              />
            </div>
          </div>

          <div className="col-span-2">
            <MaterialPricingSection
              formData={formData}
              setFormData={setFormData}
              isSubmitting={isSubmitting}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* 📏 Caratteristiche tecniche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📏 Caratteristiche tecniche</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width">Spessore (mm) *</Label>
            <Input
              id="width"
              type="number"
              value={formData.width}
              onChange={(e) => handleChange('width', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="sheet_thickness">Spessore Lamiera (mm)</Label>
            <Input
              id="sheet_thickness"
              type="number"
              step="0.1"
              value={formData.sheet_thickness}
              onChange={(e) => handleChange('sheet_thickness', e.target.value)}
              disabled={isSubmitting}
              placeholder="0.6"
            />
          </div>

          <div>
            <Label htmlFor="weight_per_ml">Peso (kg/ml)</Label>
            <Input
              id="weight_per_ml"
              type="number"
              step="0.01"
              value={formData.weight_per_ml}
              onChange={(e) => handleChange('weight_per_ml', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="profile_type">Tipo di profilo</Label>
            <Select value={formData.profile_type} onValueChange={(value) => handleChange('profile_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo profilo" />
              </SelectTrigger>
              <SelectContent>
                {profileTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label htmlFor="surface_finish">Finitura superficiale</Label>
            <Select value={formData.surface_finish} onValueChange={(value) => handleChange('surface_finish', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona finitura" />
              </SelectTrigger>
              <SelectContent>
                {surfaceFinishOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 Incidenza per Metro Quadro */}
      <MaterialIncidenceSection 
        formData={formData}
        onChange={handleChange}
      />

      {/* 🔄 Compatibilità sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔄 Compatibilità sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rei_compatible"
              checked={formData.rei_compatible === 'true'}
              onCheckedChange={(checked) => handleChange('rei_compatible', checked.toString())}
              disabled={isSubmitting}
            />
            <Label htmlFor="rei_compatible">Compatibile con sistemi REI</Label>
          </div>

          <div>
            <Label htmlFor="installation_notes">Note di posa</Label>
            <Textarea
              id="installation_notes"
              value={formData.installation_notes}
              onChange={(e) => handleChange('installation_notes', e.target.value)}
              disabled={isSubmitting}
              placeholder="Inserire eventuali note specifiche per l'installazione della guida"
            />
          </div>
        </CardContent>
      </Card>

      {/* 🔥 Prestazioni al fuoco */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔥 Prestazioni al fuoco</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fire_class">Classe</Label>
            <Input
              id="fire_class"
              value="A1"
              disabled
              className="bg-gray-100"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Le guide in acciaio hanno sempre classe antincendio A1
            </p>
          </div>

          <div>
            <Label htmlFor="fire_description">Descrizione</Label>
            <Textarea
              id="fire_description"
              value="Materiale incombustibile. Non contribuisce al carico di incendio."
              disabled
              className="bg-gray-100"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuideMaterialForm;
