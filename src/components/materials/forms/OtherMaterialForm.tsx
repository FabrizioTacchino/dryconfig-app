
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaterialFormData } from './MaterialFormData';
import MaterialPricingSection from './MaterialPricingSection';

interface OtherMaterialFormProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const OtherMaterialForm = ({
  formData,
  setFormData,
  isSubmitting
}: OtherMaterialFormProps) => {
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="code">Codice *</Label>
        <Input id="code" value={formData.code} onChange={e => setFormData(prev => ({
          ...prev,
          code: e.target.value
        }))} disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
          ...prev,
          name: e.target.value
        }))} disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="description">Descrizione</Label>
        <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({
          ...prev,
          description: e.target.value
        }))} disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="supplier">Fornitore *</Label>
        <Input id="supplier" value={formData.supplier} onChange={e => setFormData(prev => ({
          ...prev,
          supplier: e.target.value
        }))} disabled={isSubmitting} />
      </div>

      {/* Prezzi - Utilizza il componente standardizzato */}
      <MaterialPricingSection
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="incidence_per_sqm">Incidenza su mq *</Label>
          <Input
            id="incidence_per_sqm"
            type="number"
            min="0"
            step="0.001"
            value={formData.incidence_per_sqm}
            onChange={e => setFormData(prev => ({
              ...prev,
              incidence_per_sqm: e.target.value
            }))}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="is_variable_thickness" className="mb-0">Spessore Variabile?</Label>
        <input
          id="is_variable_thickness"
          type="checkbox"
          checked={!!formData.is_variable_thickness}
          onChange={e => setFormData(prev => ({
            ...prev,
            is_variable_thickness: e.target.checked
          }))}
          disabled={isSubmitting}
        />
        {!formData.is_variable_thickness && (
          <div className="flex-1">
            <Input
              id="thickness"
              value={formData.thickness}
              type="number"
              placeholder="Spessore in mm"
              min="0"
              onChange={e => setFormData(prev => ({
                ...prev,
                thickness: e.target.value
              }))}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="color_hex">Colore</Label>
        <Input id="color_hex" type="color" value={formData.color_hex} onChange={e => setFormData(prev => ({
          ...prev,
          color_hex: e.target.value
        }))} disabled={isSubmitting} style={{ width: "60px", height: "40px", padding: 0 }}/>
      </div>

      {/* Sezioni personalizzate */}
      <div>
        <Label>Prestazioni Meccaniche</Label>
        <Textarea value={formData.mechanical_performance || ''} onChange={e => setFormData(prev => ({
          ...prev, mechanical_performance: e.target.value
        }))} disabled={isSubmitting} placeholder="Descrivi le prestazioni meccaniche" />
      </div>
      <div>
        <Label>Prestazioni Termo-Igrometriche</Label>
        <Textarea value={formData.thermal_performance_notes || ''} onChange={e => setFormData(prev => ({
          ...prev, thermal_performance_notes: e.target.value
        }))} disabled={isSubmitting} placeholder="Note su prestazioni termo-igrometriche" />
      </div>
      <div>
        <Label>Sostenibilità e Ambiente</Label>
        <Textarea value={formData.sustainability_notes || ''} onChange={e => setFormData(prev => ({
          ...prev, sustainability_notes: e.target.value
        }))} disabled={isSubmitting} placeholder="Note su sostenibilità" />
      </div>
      <div>
        <Label>Compatibilità Sistema</Label>
        <Textarea value={formData.system_compatibility || ''} onChange={e => setFormData(prev => ({
          ...prev, system_compatibility: e.target.value
        }))} disabled={isSubmitting} placeholder="Note su compatibilità" />
      </div>
      <div>
        <Label>Prestazioni al fuoco</Label>
        <Textarea value={formData.fire_performance_notes || ''} onChange={e => setFormData(prev => ({
          ...prev, fire_performance_notes: e.target.value
        }))} disabled={isSubmitting} placeholder="Note su prestazioni al fuoco" />
      </div>
      <div>
        <Label>Carbon Footprint</Label>
        <Input value={formData.carbon_footprint || ''} onChange={e => setFormData(prev => ({
          ...prev, carbon_footprint: e.target.value
        }))} disabled={isSubmitting} />
      </div>
      <div>
        <Label>EPD</Label>
        <Input value={formData.epd || ''} onChange={e => setFormData(prev => ({
          ...prev, epd: e.target.value
        }))} disabled={isSubmitting} />
      </div>
      <div>
        <Label>Permeabilità al vapore</Label>
        <Input value={formData.vapor_permeability || ''} onChange={e => setFormData(prev => ({
          ...prev, vapor_permeability: e.target.value
        }))} disabled={isSubmitting} />
      </div>
      <div>
        <Label>Capacità termica</Label>
        <Input value={formData.thermal_capacity || ''} onChange={e => setFormData(prev => ({
          ...prev, thermal_capacity: e.target.value
        }))} disabled={isSubmitting} />
      </div>
    </div>
  );
};

export default OtherMaterialForm;
