import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatabaseMaterial } from '@/hooks/useMaterials';

interface LayerMaterialSelectProps {
  material_id: string;  // Using material_id instead of materialId to match other components
  materials: DatabaseMaterial[];
  onMaterialChange: (materialId: string) => void;
}

interface DedupedMaterial extends DatabaseMaterial {
  _available_lengths_mm?: number[];
  _grouped_ids?: string[];
}

/**
 * Dedup profili (montanti/guide) per chiave (supplier+name+profile_type+width+sheet_thickness):
 * stesso profilo venduto in barre 3m / 4m → una sola voce nel dropdown,
 * con suffisso "(disp. 3m / 4m)". Selezionare la voce salva l'id del primo (più corto).
 *
 * Per categorie non-profilo non applica nessuna dedup (passa lista invariata).
 */
function dedupeProfiles(materials: DatabaseMaterial[]): DedupedMaterial[] {
  const isProfile = (m: DatabaseMaterial) =>
    m.category === 'structure_frame' || m.category === 'structure_guide';

  if (!materials.some(isProfile)) return materials;

  const groups = new Map<string, DatabaseMaterial[]>();
  const others: DedupedMaterial[] = [];

  for (const m of materials) {
    if (!isProfile(m)) {
      others.push(m);
      continue;
    }
    const key = [
      m.supplier,
      m.profile_type ?? '',
      m.width ?? '',
      m.sheet_thickness ?? '',
      m.name.toLowerCase().trim(),
    ].join('|');
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  const deduped: DedupedMaterial[] = [];
  for (const arr of groups.values()) {
    if (arr.length === 1) {
      deduped.push(arr[0]);
      continue;
    }
    // Ordina per lunghezza asc; rappresentante = il più corto
    arr.sort((a, b) => (Number(a.length) || 0) - (Number(b.length) || 0));
    const rep: DedupedMaterial = { ...arr[0] };
    rep._available_lengths_mm = arr
      .map(x => Number(x.length))
      .filter(n => Number.isFinite(n) && n > 0);
    rep._grouped_ids = arr.map(x => x.id);
    deduped.push(rep);
  }

  return [...others, ...deduped];
}

const formatLengthLabel = (lengths_mm: number[] | undefined): string => {
  if (!lengths_mm || lengths_mm.length <= 1) return '';
  const meters = lengths_mm.map(mm => `${(mm / 1000).toString().replace('.', ',')}m`);
  return ` · barre ${meters.join('/')}`;
};

const LayerMaterialSelect = ({ material_id, materials, onMaterialChange }: LayerMaterialSelectProps) => {
  const visibleMaterials = useMemo(() => dedupeProfiles(materials), [materials]);

  return (
    <Select value={material_id} onValueChange={onMaterialChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Seleziona materiale" />
      </SelectTrigger>
      <SelectContent>
        {visibleMaterials.length === 0 ? (
          <SelectItem value="none" disabled>Nessun materiale disponibile</SelectItem>
        ) : (
          visibleMaterials.map(material => {
            const lengthLabel = formatLengthLabel((material as DedupedMaterial)._available_lengths_mm);
            return (
              <SelectItem key={material.id} value={material.id}>
                {material.name} - {material.supplier} - (€{material.unit_price.toFixed(2)}/{material.unit}){lengthLabel}
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
};

export default LayerMaterialSelect;
