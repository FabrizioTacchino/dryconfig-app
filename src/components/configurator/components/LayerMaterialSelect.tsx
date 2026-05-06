
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatabaseMaterial } from '@/hooks/useMaterials';

interface LayerMaterialSelectProps {
  material_id: string;  // Using material_id instead of materialId to match other components
  materials: DatabaseMaterial[];
  onMaterialChange: (materialId: string) => void;
}

const LayerMaterialSelect = ({ material_id, materials, onMaterialChange }: LayerMaterialSelectProps) => {
  return (
    <Select value={material_id} onValueChange={onMaterialChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Seleziona materiale" />
      </SelectTrigger>
      <SelectContent>
        {materials.length === 0 ? (
          <SelectItem value="none" disabled>Nessun materiale disponibile</SelectItem>
        ) : (
          materials.map(material => (
            <SelectItem key={material.id} value={material.id}>
              {material.name} - {material.supplier} - (€{material.unit_price.toFixed(2)}/{material.unit})
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default LayerMaterialSelect;
