import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { DatabaseMaterial } from '@/hooks/useMaterials';

interface GroupedMaterialSelectProps {
  material_id: string;
  materials: DatabaseMaterial[];
  onMaterialChange: (materialId: string) => void;
}

const GroupedMaterialSelect = ({ material_id, materials, onMaterialChange }: GroupedMaterialSelectProps) => {
  // Raggruppa i materiali per tipologia
  const groupedMaterials = materials.reduce((groups, material) => {
    const typology = material.board_typology || 'altro';
    if (!groups[typology]) {
      groups[typology] = [];
    }
    groups[typology].push(material);
    return groups;
  }, {} as Record<string, DatabaseMaterial[]>);

  // Mappatura delle etichette per le tipologie - Sistema aggiornato
  const typologyLabels: Record<string, string> = {
    'standard': 'Standard',
    'idro': 'Idro',
    'antivapore': 'Antivapore',
    'ignifuga': 'Ignifuga / Fire',
    'alta_densita': 'Alta Densità / Rinforzata',
    'idro_fire': 'Idro-Fire / Climatica',
    'fibrocemento': 'Fibrocemento / Idro',
    'doppia_densita': 'Doppia Densità / Isolamento',
    'acustica': 'Acustica',
    'antimuffa': 'Antimuffa / Antibatterica',
    'speciali': 'Speciali / Tecniche',
    'altro': 'Altro'
  };

  // Ordine preferito delle tipologie - Ordine di frequenza d'uso
  const typologyOrder = [
    'standard', 
    'idro', 
    'ignifuga', 
    'alta_densita', 
    'antivapore', 
    'idro_fire', 
    'fibrocemento', 
    'doppia_densita', 
    'acustica', 
    'antimuffa', 
    'speciali', 
    'altro'
  ];

  return (
    <Select value={material_id} onValueChange={onMaterialChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Seleziona materiale" />
      </SelectTrigger>
      <SelectContent>
        {materials.length === 0 ? (
          <SelectItem value="none" disabled>Nessun materiale disponibile</SelectItem>
        ) : (
          typologyOrder.map(typology => {
            const groupMaterials = groupedMaterials[typology];
            if (!groupMaterials || groupMaterials.length === 0) return null;

            return (
              <SelectGroup key={typology}>
                <SelectLabel className="text-xs font-bold text-black px-2 py-1">
                  {typologyLabels[typology] || typology}
                </SelectLabel>
                {groupMaterials
                  .filter(material => material.id && material.id.trim() !== '') // Filtra materiali con ID validi
                  .map(material => (
                    <SelectItem key={material.id} value={material.id} className="pl-4">
                      {material.name} - {material.supplier} - (€{material.unit_price.toFixed(2)}/{material.unit})
                    </SelectItem>
                  ))}
              </SelectGroup>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
};

export default GroupedMaterialSelect;