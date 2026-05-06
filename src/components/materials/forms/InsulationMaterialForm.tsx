import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Wrench, Hammer, Droplets, Leaf, Settings, Target, Flame } from 'lucide-react';
import { MaterialFormData } from './MaterialFormData';
import MaterialBasicInfoSection from './MaterialBasicInfoSection';
import MaterialPricingSection from './MaterialPricingSection';
import MaterialIncidenceSection from './MaterialIncidenceSection';

interface InsulationMaterialFormProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

// Opzioni per tipo di materiale isolante
const insulationTypeOptions = [
  { value: 'lana_vetro', label: 'Lana di vetro' },
  { value: 'lana_roccia', label: 'Lana di roccia' },
  { value: 'eps', label: 'EPS (Polistirene espanso)' },
  { value: 'xps', label: 'XPS (Polistirene estruso)' },
  { value: 'pet', label: 'PET (Polietilene tereftalato)' },
  { value: 'fibra_legno', label: 'Fibra di legno' },
  { value: 'sughero', label: 'Sughero' },
  { value: 'canapa', label: 'Canapa' },
  { value: 'lino', label: 'Lino' },
  { value: 'altro', label: 'Altro' }
];

// Opzioni per formato
const formatOptions = [
  { value: 'pannello', label: 'Pannello' },
  { value: 'rotolo', label: 'Rotolo' },
  { value: 'materassino', label: 'Materassino' },
  { value: 'sfuso', label: 'Sfuso' }
];

// Opzioni per comportamento all'umidità
const humidityBehaviorOptions = [
  { value: 'idrofugo', label: 'Idrofugo' },
  { value: 'assorbente', label: 'Assorbente' },
  { value: 'neutro', label: 'Neutro' }
];

// Opzioni per uso previsto
const intendedUseOptions = [
  { value: 'pareti', label: 'Pareti' },
  { value: 'controsoffitti', label: 'Controsoffitti' },
  { value: 'facciate', label: 'Facciate' },
  { value: 'coperture', label: 'Coperture' },
  { value: 'pavimenti', label: 'Pavimenti' }
];

const InsulationMaterialForm = ({ formData, setFormData, isSubmitting }: InsulationMaterialFormProps) => {
  const handleFieldChange = (field: keyof MaterialFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleIntendedUseChange = (use: string, checked: boolean) => {
    const currentUses = formData.intended_use ? formData.intended_use.split(', ').filter(Boolean) : [];
    let newUses;
    
    if (checked) {
      newUses = [...currentUses, use];
    } else {
      newUses = currentUses.filter(u => u !== use);
    }
    
    handleFieldChange('intended_use', newUses.join(', '));
  };

  return (
    <div className="space-y-6">
      {/* Identificativi generali */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Identificativi generali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MaterialBasicInfoSection 
            formData={formData} 
            setFormData={setFormData} 
            isSubmitting={isSubmitting} 
          />
          
          {/* Tipo di materiale isolante e Formato */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material_type">Tipo di Materiale *</Label>
              <select
                id="material_type"
                value={formData.material_type}
                onChange={(e) => handleFieldChange('material_type', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md"
                disabled={isSubmitting}
              >
                {insulationTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="board_typology">Formato *</Label>
              <select
                id="board_typology"
                value={formData.board_typology}
                onChange={(e) => handleFieldChange('board_typology', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md"
                disabled={isSubmitting}
              >
                {formatOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Colore */}
          <div>
            <Label htmlFor="color_hex">Colore</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color_hex"
                value={formData.color_hex}
                onChange={(e) => handleFieldChange('color_hex', e.target.value)}
                className="w-12 h-10 border border-input rounded cursor-pointer"
                disabled={isSubmitting}
              />
              <Input
                value={formData.color_hex}
                onChange={(e) => handleFieldChange('color_hex', e.target.value)}
                placeholder="#CCCCCC"
                disabled={isSubmitting}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caratteristiche tecniche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Caratteristiche tecniche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="thickness">Spessore (mm)</Label>
              <Input
                id="thickness"
                type="number"
                value={formData.thickness}
                onChange={(e) => handleFieldChange('thickness', e.target.value)}
                placeholder="Spessore"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="density">Densità (kg/m³) *</Label>
              <Input
                id="density"
                type="number"
                value={formData.density}
                onChange={(e) => handleFieldChange('density', e.target.value)}
                placeholder="Densità"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="weight_per_sqm">Peso (kg/m²)</Label>
              <Input
                id="weight_per_sqm"
                type="number"
                step="0.1"
                value={formData.weight_per_sqm}
                onChange={(e) => handleFieldChange('weight_per_sqm', e.target.value)}
                placeholder="Peso per m²"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="thermal_conductivity">Conduttività Termica (W/mK)</Label>
              <Input
                id="thermal_conductivity"
                type="number"
                step="0.001"
                value={formData.thermal_conductivity}
                onChange={(e) => handleFieldChange('thermal_conductivity', e.target.value)}
                placeholder="λ"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="acoustic_performance">Prestazione Acustica (dB)</Label>
              <Input
                id="acoustic_performance"
                type="number"
                value={formData.acoustic_performance}
                onChange={(e) => handleFieldChange('acoustic_performance', e.target.value)}
                placeholder="Riduzione acustica"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prestazioni meccaniche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5" />
            Prestazioni meccaniche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="flexural_strength">Resistenza alla flessione</Label>
              <Input
                id="flexural_strength"
                value={formData.flexural_strength}
                onChange={(e) => handleFieldChange('flexural_strength', e.target.value)}
                placeholder="es. N/A (isolanti flessibili)"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="surface_hardness">Durezza superficiale</Label>
              <Input
                id="surface_hardness"
                value={formData.surface_hardness}
                onChange={(e) => handleFieldChange('surface_hardness', e.target.value)}
                placeholder="es. Comprimibile"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prestazioni termo-igrometriche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Prestazioni termo-igrometriche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="water_absorption">Assorbimento Acqua (kg/m²)</Label>
              <Input
                id="water_absorption"
                value={formData.water_absorption}
                onChange={(e) => handleFieldChange('water_absorption', e.target.value)}
                placeholder="es. ≤ 1 kg/m²"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="humidity_resistance_class">Comportamento all'Umidità</Label>
              <select
                id="humidity_resistance_class"
                value={formData.humidity_resistance_class}
                onChange={(e) => handleFieldChange('humidity_resistance_class', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md"
                disabled={isSubmitting}
              >
                <option value="">Seleziona comportamento</option>
                {humidityBehaviorOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="surface_hardness">Traspirabilità μ</Label>
            <Input
              id="surface_hardness"
              value={formData.surface_hardness}
              onChange={(e) => handleFieldChange('surface_hardness', e.target.value)}
              placeholder="es. 1 (lana), 40 (XPS)"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sostenibilità e ambiente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Sostenibilità e ambiente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="environmental_certification">Certificazione Ambientale</Label>
              <Input
                id="environmental_certification"
                value={formData.environmental_certification}
                onChange={(e) => handleFieldChange('environmental_certification', e.target.value)}
                placeholder="es. GREENGUARD, EPD"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="recycled_content">Contenuto Riciclato (%)</Label>
              <Input
                id="recycled_content"
                type="number"
                min="0"
                max="100"
                value={formData.recycled_content}
                onChange={(e) => handleFieldChange('recycled_content', e.target.value)}
                placeholder="Percentuale riciclato"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="voc_class">Classe VOC</Label>
            <Input
              id="voc_class"
              value={formData.voc_class}
              onChange={(e) => handleFieldChange('voc_class', e.target.value)}
              placeholder="es. A+, A, B"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compatibilità sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compatibilità sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rei_compatible"
              checked={formData.rei_compatible === 'true'}
              onCheckedChange={(checked) => handleFieldChange('rei_compatible', checked ? 'true' : 'false')}
              disabled={isSubmitting}
            />
            <Label htmlFor="rei_compatible">Compatibile con sistemi REI</Label>
          </div>

          <div>
            <Label htmlFor="installation_notes">Note di posa</Label>
            <Textarea
              id="installation_notes"
              value={formData.installation_notes}
              onChange={(e) => handleFieldChange('installation_notes', e.target.value)}
              placeholder="Note e istruzioni per l'installazione"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Uso previsto (selezione multipla) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Uso previsto (selezione multipla)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {intendedUseOptions.map(option => {
              const currentUses = formData.intended_use ? formData.intended_use.split(', ') : [];
              const isChecked = currentUses.includes(option.value);
              
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`use_${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleIntendedUseChange(option.value, checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={`use_${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Prestazioni al fuoco */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Prestazioni al fuoco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fire_class">Classe di Reazione al Fuoco</Label>
              <Input
                id="fire_class"
                value={formData.fire_class}
                onChange={(e) => handleFieldChange('fire_class', e.target.value)}
                placeholder="es. A1, B-s1,d0"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="fire_resistance_class">Classe di Resistenza al Fuoco</Label>
              <Input
                id="fire_resistance_class"
                value={formData.fire_resistance_class}
                onChange={(e) => handleFieldChange('fire_resistance_class', e.target.value)}
                placeholder="es. REI 120"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="fire_description">Descrizione Comportamento al Fuoco</Label>
            <Textarea
              id="fire_description"
              value={formData.fire_description}
              onChange={(e) => handleFieldChange('fire_description', e.target.value)}
              placeholder="Descrizione del comportamento al fuoco"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prezzi e Costi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prezzi e Costi</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialPricingSection 
            formData={formData} 
            setFormData={setFormData}
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>

      {/* Incidenza e Consumo - Fisso per isolanti */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incidenza e Consumo</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialIncidenceSection 
            formData={formData} 
            onChange={handleFieldChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InsulationMaterialForm;
