
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialFormData } from './MaterialFormData';
import MaterialBasicInfoSection from './MaterialBasicInfoSection';
import MaterialPricingSection from './MaterialPricingSection';
import MaterialTechnicalSection from './MaterialTechnicalSection';
import MaterialIncidenceSection from './MaterialIncidenceSection';

interface AccessoryMaterialFormEditProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const AccessoryMaterialFormEdit = ({ formData, setFormData, isSubmitting }: AccessoryMaterialFormEditProps) => {
  const handleFieldChange = (field: keyof MaterialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <MaterialBasicInfoSection 
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />

      {/* Caratteristiche Specifiche Accessori */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔧 Caratteristiche Accessorio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="material_type">Tipo accessorio</Label>
            <select
              id="material_type"
              value={formData.material_type}
              onChange={(e) => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md"
              disabled={isSubmitting}
            >
              <option value="">Seleziona tipo</option>
              <option value="nastro">Nastro</option>
              <option value="angolare">Angolare</option>
              <option value="stucco">Stucco</option>
              <option value="primer">Primer</option>
              <option value="sigillante">Sigillante</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div>
            <Label htmlFor="width">Larghezza (mm)</Label>
            <Input
              id="width"
              type="number"
              step="0.1"
              min="0"
              value={formData.width}
              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="length">Lunghezza (mm)</Label>
            <Input
              id="length"
              type="number"
              step="0.1"
              min="0"
              value={formData.length}
              onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="thickness">Spessore (mm)</Label>
            <Input
              id="thickness"
              type="number"
              step="0.1"
              min="0"
              value={formData.thickness}
              onChange={(e) => setFormData(prev => ({ ...prev, thickness: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="color_hex">Colore</Label>
            <div className="flex gap-2">
              <Input
                id="color_hex"
                type="color"
                value={formData.color_hex}
                onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                disabled={isSubmitting}
                className="w-20"
              />
              <Input
                type="text"
                value={formData.color_hex}
                onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                disabled={isSubmitting}
                placeholder="#CCCCCC"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="environmental_certification">Certificazioni</Label>
            <Input
              id="environmental_certification"
              value={formData.environmental_certification}
              onChange={(e) => setFormData(prev => ({ ...prev, environmental_certification: e.target.value }))}
              disabled={isSubmitting}
              placeholder="es. CE, EPD"
            />
          </div>
        </CardContent>
      </Card>

      <MaterialTechnicalSection 
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />

      <MaterialIncidenceSection 
        formData={formData}
        onChange={handleFieldChange}
      />

      <MaterialPricingSection 
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AccessoryMaterialFormEdit;
