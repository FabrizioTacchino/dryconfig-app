import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStratigraphy } from '@/hooks/useStratigraphy';
import { useIntegratedStratigraphySave } from '@/hooks/useIntegratedStratigraphySave';
import type { DatabaseMaterial } from '@/hooks/useMaterials';
import { toast } from 'sonner';
import type { LayerV2 } from '../types';
import { useTypologyDetection, typologyLabel } from './useTypologyDetection';
import { useSystemCode } from './useSystemCode';

/**
 * Genera UUID v4 client-side per ID layer locali (sostituiti da uuid DB al save).
 */
const newId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

interface UseConfiguratorStateProps {
  /** ID stratigrafia esistente da caricare. null/undefined = nuova. */
  stratigraphyId?: string | null;
}

interface UseConfiguratorStateReturn {
  // State
  id: string | null;
  name: string;
  description: string;
  layers: LayerV2[];
  isLoading: boolean;
  isDirty: boolean;
  isSaving: boolean;
  loadError: string | null;
  // Derived
  typology: ReturnType<typeof useTypologyDetection>;
  typologyLabel: string;
  systemCode: string;
  totalThicknessMm: number;
  // Actions
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  addLayer: (initial?: Partial<LayerV2>) => string; // ritorna l'id del nuovo layer
  updateLayer: (id: string, patch: Partial<LayerV2>) => void;
  removeLayer: (id: string) => void;
  reorderLayers: (orderedIds: string[]) => void;
  setMaterial: (layerId: string, material: DatabaseMaterial) => void;
  save: () => void;
  canSave: boolean;
}

/**
 * State machine del Configuratore V2.
 *
 * Carica una stratigrafia esistente o crea da zero. Gestisce lo stato locale
 * (layers, nome, descrizione, dirty flag), la generazione del codice sistema e
 * la tipologia auto-rilevata. Espone azioni per modifica/save.
 *
 * Vedi `docs/mockupui.md` §22.
 */
export function useConfiguratorState({
  stratigraphyId,
}: UseConfiguratorStateProps): UseConfiguratorStateReturn {
  const { data: loaded, isLoading, error: loadError } = useStratigraphy(stratigraphyId ?? undefined);
  const saveMutation = useIntegratedStratigraphySave();

  const [id, setId] = useState<string | null>(stratigraphyId ?? null);
  const [name, setNameRaw] = useState('');
  const [description, setDescriptionRaw] = useState('');
  const [layers, setLayers] = useState<LayerV2[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Hydrate da DB quando arriva
  useEffect(() => {
    if (!loaded) return;
    setId(loaded.id);
    setNameRaw(loaded.name ?? '');
    setDescriptionRaw(loaded.description ?? '');
    const hydrated: LayerV2[] = (loaded.layers ?? []).map((l: any, idx: number) => ({
      id: l.id ?? newId(),
      position: l.position ?? idx + 1,
      materialId: l.materialId ?? null,
      material: l.material ?? null,
      thickness: Number(l.thickness ?? l.material?.thickness ?? 0),
      interAxis: l.interAxis ?? l.inter_axis ?? undefined,
      screwMaterialId: l.screwMaterialId ?? null,
      screwMaterial: l.screwMaterial ?? null,
      screwQuantity: l.screwQuantity ?? undefined,
      screwCostPerSqm: l.screwCostPerSqm ?? undefined,
    }));
    setLayers(hydrated);
    setIsDirty(false);
  }, [loaded]);

  // Tipologia + codice sistema auto-derivati
  const typology = useTypologyDetection(layers);
  const systemCode = useSystemCode({ typology, layers });

  const totalThicknessMm = useMemo(
    () => layers.reduce((sum, l) => sum + (Number(l.thickness) || 0), 0),
    [layers],
  );

  // Wrapper per marcare dirty
  const setName = useCallback((v: string) => {
    setNameRaw(v);
    setIsDirty(true);
  }, []);

  const setDescription = useCallback((v: string) => {
    setDescriptionRaw(v);
    setIsDirty(true);
  }, []);

  const addLayer = useCallback((initial: Partial<LayerV2> = {}): string => {
    const newLayerId = newId();
    setLayers(prev => [
      ...prev,
      {
        id: newLayerId,
        position: prev.length + 1,
        materialId: null,
        material: null,
        thickness: 0,
        ...initial,
      },
    ]);
    setIsDirty(true);
    return newLayerId;
  }, []);

  const updateLayer = useCallback((layerId: string, patch: Partial<LayerV2>) => {
    setLayers(prev => prev.map(l => (l.id === layerId ? { ...l, ...patch } : l)));
    setIsDirty(true);
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev =>
      prev
        .filter(l => l.id !== layerId)
        .map((l, idx) => ({ ...l, position: idx + 1 })),
    );
    setIsDirty(true);
  }, []);

  const reorderLayers = useCallback((orderedIds: string[]) => {
    setLayers(prev => {
      const map = new Map(prev.map(l => [l.id, l]));
      return orderedIds
        .map(id => map.get(id))
        .filter((l): l is LayerV2 => Boolean(l))
        .map((l, idx) => ({ ...l, position: idx + 1 }));
    });
    setIsDirty(true);
  }, []);

  const setMaterial = useCallback((layerId: string, material: DatabaseMaterial) => {
    setLayers(prev =>
      prev.map(l => {
        if (l.id !== layerId) return l;
        // Se il layer non aveva spessore, prendi dal materiale
        const thickness = l.thickness > 0 ? l.thickness : Number(material.thickness) || 0;
        return {
          ...l,
          materialId: material.id,
          material,
          thickness,
        };
      }),
    );
    setIsDirty(true);
  }, []);

  const isValidName = name.trim().length > 0;
  const hasAtLeastOneCompleteLayer = layers.some(l => l.materialId && l.thickness > 0);
  const canSave = isValidName && hasAtLeastOneCompleteLayer && !saveMutation.isPending;

  const save = useCallback(() => {
    if (!canSave) {
      if (!isValidName) toast.error('Inserisci un nome per la stratigrafia');
      else toast.error('Aggiungi almeno un layer completo prima di salvare');
      return;
    }

    saveMutation.mutate(
      {
        id: id ?? undefined,
        name: name.trim(),
        description,
        layers: layers.map(l => ({
          materialId: l.materialId,
          material: l.material,
          thickness: l.thickness,
          interAxis: l.interAxis,
          screwMaterialId: l.screwMaterialId,
          screwMaterial: l.screwMaterial,
          screwQuantity: l.screwQuantity,
          screwCostPerSqm: l.screwCostPerSqm,
        })),
        totalThickness: totalThicknessMm,
        weightPerSqm: 0, // calcolo in V2.1 con materiali tecnici
        // previewCosts → undefined: fallback al calcolo interno del save
      },
      {
        onSuccess: (res) => {
          setIsDirty(false);
          if (res?.stratigraphyId && !id) setId(res.stratigraphyId);
        },
      },
    );
  }, [canSave, isValidName, saveMutation, id, name, description, layers, totalThicknessMm]);

  return {
    id,
    name,
    description,
    layers,
    isLoading,
    isDirty,
    isSaving: saveMutation.isPending,
    loadError: loadError ? String((loadError as Error).message ?? loadError) : null,
    typology,
    typologyLabel: typologyLabel(typology),
    systemCode,
    totalThicknessMm,
    setName,
    setDescription,
    addLayer,
    updateLayer,
    removeLayer,
    reorderLayers,
    setMaterial,
    save,
    canSave,
  };
}
