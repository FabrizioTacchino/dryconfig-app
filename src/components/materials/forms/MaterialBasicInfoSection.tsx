import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaterialFormData, categories } from './MaterialFormData';
import { MaterialCategory } from '@/types';
interface MaterialBasicInfoSectionProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}
const MaterialBasicInfoSection = ({
  formData,
  setFormData,
  isSubmitting
}: MaterialBasicInfoSectionProps) => {
  return <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Codice *</Label>
          <Input id="code" value={formData.code} onChange={e => setFormData(prev => ({
          ...prev,
          code: e.target.value
        }))} placeholder="es. LAM-001" disabled={isSubmitting} />
        </div>
        
      </div>

      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
        ...prev,
        name: e.target.value
      }))} placeholder="Nome del materiale" disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="description">Descrizione</Label>
        <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({
        ...prev,
        description: e.target.value
      }))} placeholder="Descrizione dettagliata del materiale" disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="supplier">Fornitore *</Label>
        <Input id="supplier" value={formData.supplier} onChange={e => setFormData(prev => ({
        ...prev,
        supplier: e.target.value
      }))} placeholder="Nome del fornitore" disabled={isSubmitting} />
      </div>
    </>;
};
export default MaterialBasicInfoSection;