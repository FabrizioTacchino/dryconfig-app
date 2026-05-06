import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MaterialFormData, boardMaterialOptions, boardTypologyOptions } from './MaterialFormData';
import MaterialPricingSection from './MaterialPricingSection';

interface BoardMaterialFormProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const BoardMaterialForm = ({ formData, setFormData, isSubmitting }: BoardMaterialFormProps) => {
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

      {/* Prezzi e Tempi - Usa il componente standardizzato */}
      <MaterialPricingSection
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />

      {/* 🧱 Caratteristiche tecniche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧱 Caratteristiche tecniche</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="thickness">Spessore (mm) *</Label>
            <Input
              id="thickness"
              type="number"
              value={formData.thickness}
              onChange={(e) => handleChange('thickness', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="width">Larghezza (mm)</Label>
            <Input
              id="width"
              type="number"
              value={formData.width}
              onChange={(e) => handleChange('width', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="length">Lunghezza (mm)</Label>
            <Input
              id="length"
              type="number"
              value={formData.length}
              onChange={(e) => handleChange('length', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="weight_per_sqm">Peso per mq (kg/mq)</Label>
            <Input
              id="weight_per_sqm"
              type="number"
              step="0.01"
              value={formData.weight_per_sqm}
              onChange={(e) => handleChange('weight_per_sqm', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="material_type">Materiale</Label>
            <Select value={formData.material_type} onValueChange={(value) => handleChange('material_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona materiale" />
              </SelectTrigger>
              <SelectContent>
                {boardMaterialOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="board_typology">Tipologia</Label>
            <Select value={formData.board_typology} onValueChange={(value) => handleChange('board_typology', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipologia" />
              </SelectTrigger>
              <SelectContent>
                {boardTypologyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="density">Densità (kg/m3)</Label>
            <Input
              id="density"
              type="number"
              value={formData.density}
              onChange={(e) => handleChange('density', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="flexural_strength">Resistenza a flessione (MPa)</Label>
            <Input
              id="flexural_strength"
              type="text"
              value={formData.flexural_strength}
              onChange={(e) => handleChange('flexural_strength', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="surface_hardness">Durezza superficiale</Label>
            <Input
              id="surface_hardness"
              type="text"
              value={formData.surface_hardness}
              onChange={(e) => handleChange('surface_hardness', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="en_520_type">Tipo EN 520</Label>
            <Input
              id="en_520_type"
              type="text"
              value={formData.en_520_type}
              onChange={(e) => handleChange('en_520_type', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="water_absorption">Assorbimento acqua (%)</Label>
            <Input
              id="water_absorption"
              type="text"
              value={formData.water_absorption}
              onChange={(e) => handleChange('water_absorption', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="humidity_resistance_class">Classe resistenza umidità</Label>
            <Input
              id="humidity_resistance_class"
              type="text"
              value={formData.humidity_resistance_class}
              onChange={(e) => handleChange('humidity_resistance_class', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* 🌿 Sostenibilità e ambiente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🌿 Sostenibilità e ambiente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="environmental_certification">Certificazione ambientale</Label>
            <Input
              id="environmental_certification"
              type="text"
              value={formData.environmental_certification}
              onChange={(e) => handleChange('environmental_certification', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="recycled_content">Contenuto riciclato (%)</Label>
            <Input
              id="recycled_content"
              type="number"
              value={formData.recycled_content}
              onChange={(e) => handleChange('recycled_content', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="voc_class">Classe VOC</Label>
            <Input
              id="voc_class"
              type="text"
              value={formData.voc_class}
              onChange={(e) => handleChange('voc_class', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* 🎯 Prestazioni e compatibilità */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎯 Prestazioni e compatibilità</CardTitle>
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
            <Label htmlFor="intended_use">Uso previsto</Label>
            <Textarea
              id="intended_use"
              value={formData.intended_use}
              onChange={(e) => handleChange('intended_use', e.target.value)}
              disabled={isSubmitting}
              placeholder="Es: Pareti interne, Controsoffitti, Rivestimenti"
            />
          </div>

          <div>
            <Label htmlFor="installation_notes">Note di posa</Label>
            <Textarea
              id="installation_notes"
              value={formData.installation_notes}
              onChange={(e) => handleChange('installation_notes', e.target.value)}
              disabled={isSubmitting}
              placeholder="Inserire eventuali note specifiche per l'installazione della lastra"
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
              value={formData.fire_class}
              onChange={(e) => handleChange('fire_class', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="fire_description">Descrizione</Label>
            <Textarea
              id="fire_description"
              value={formData.fire_description}
              onChange={(e) => handleChange('fire_description', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="board_type">Tipologia</Label>
            <Input
              id="board_type"
              value={formData.board_type}
              onChange={(e) => handleChange('board_type', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="fire_usage_notes">Note sull'utilizzo</Label>
            <Textarea
              id="fire_usage_notes"
              value={formData.fire_usage_notes}
              onChange={(e) => handleChange('fire_usage_notes', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BoardMaterialForm;
