
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialFormData } from './MaterialFormData';

interface MaterialTechnicalSectionProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const MaterialTechnicalSection = ({ formData, setFormData, isSubmitting }: MaterialTechnicalSectionProps) => {
  const isBoard = formData.category === 'board';

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Caratteristiche Tecniche</h3>
        
        {/* Dimensioni per Lastre */}
        {isBoard && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border">
            <div>
              <Label htmlFor="width">Larghezza (mm) *</Label>
              <Input
                id="width"
                type="number"
                value={formData.width}
                onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                placeholder="es. 1200"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="length">Lunghezza (mm) *</Label>
              <Input
                id="length"
                type="number"
                value={formData.length}
                onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                placeholder="es. 2600"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="thickness">Spessore (mm)</Label>
              <Input
                id="thickness"
                type="number"
                step="0.1"
                value={formData.thickness}
                onChange={(e) => setFormData(prev => ({ ...prev, thickness: e.target.value }))}
                placeholder="es. 12.5"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Spessore per altre categorie */}
        {!isBoard && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="thickness">Spessore (mm)</Label>
              <Input
                id="thickness"
                type="number"
                step="0.1"
                value={formData.thickness}
                onChange={(e) => setFormData(prev => ({ ...prev, thickness: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="weight_per_sqm">Peso (kg/mq)</Label>
              <Input
                id="weight_per_sqm"
                type="number"
                step="0.01"
                value={formData.weight_per_sqm}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_per_sqm: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Peso per lastre */}
        {isBoard && (
          <div>
            <Label htmlFor="weight_per_sqm">Peso (kg/mq)</Label>
            <Input
              id="weight_per_sqm"
              type="number"
              step="0.01"
              value={formData.weight_per_sqm}
              onChange={(e) => setFormData(prev => ({ ...prev, weight_per_sqm: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className={isBoard ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
          <div>
            <Label htmlFor="thermal_conductivity">Conduttività Termica (W/mK)</Label>
            <Input
              id="thermal_conductivity"
              type="number"
              step="0.001"
              value={formData.thermal_conductivity}
              onChange={(e) => setFormData(prev => ({ ...prev, thermal_conductivity: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
          {/* Performance Acustica nascosta per le lastre */}
          {!isBoard && (
            <div>
              <Label htmlFor="acoustic_performance">Performance Acustica (dB)</Label>
              <Input
                id="acoustic_performance"
                type="number"
                value={formData.acoustic_performance}
                onChange={(e) => setFormData(prev => ({ ...prev, acoustic_performance: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fire_resistance_class">Classe Resistenza al Fuoco</Label>
            <Input
              id="fire_resistance_class"
              value={formData.fire_resistance_class}
              onChange={(e) => setFormData(prev => ({ ...prev, fire_resistance_class: e.target.value }))}
              placeholder="es. REI 120, A1, B-s1,d0"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="color_hex">Colore (HEX)</Label>
            <Input
              id="color_hex"
              value={formData.color_hex}
              onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
              placeholder="#CCCCCC"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MaterialTechnicalSection;
