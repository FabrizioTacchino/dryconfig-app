import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStratigraphy } from '@/hooks/useStratigraphy';
import { useIntegratedStratigraphySave } from '@/hooks/useIntegratedStratigraphySave';
import { useMaterials, type DatabaseMaterial } from '@/hooks/useMaterials';
import { toast } from 'sonner';
import type { LayerV2 } from '../types';
import { useTypologyDetection, typologyLabel } from './useTypologyDetection';
import { useSystemCode } from './useSystemCode';
import { findStructureMatch, oppositeStructureCategory } from './findStructureMatch';
import { useScrewSuggestions } from './useScrewSuggestions';
import { computeScrewCostPerSqm } from '@/utils/screwPricing';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';

/**
 * Risultato del check nome duplicato.
 * Solo i campi necessari al dialog di conflitto.
 */
export interface NameConflict {
  id: string;
  name: string;
  isCertified: boolean;
}

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
  /**
   * Layer iniziali da pre-caricare nello state per una NUOVA stratigrafia
   * (non si combina con stratigraphyId). Usato dal flusso "Crea da snapshot
   * orfano": l'utente arriva con `?fromEstimateStratigraphy=<id>` e vede il
   * builder già popolato con la composizione dello snapshot.
   */
  initialLayers?: LayerV2[];
  /** Nome iniziale opzionale (es. "X (da snapshot)" per il flusso F5.6). */
  initialName?: string;
}

/**
 * Metadati certificazione completi (popolati solo se isCertified=true).
 * Riflette i parametri tipici di una scheda certificata Knauf W11x / Gyproc /
 * Siniat / Fassa. Tutti i campi sono opzionali — l'utente compila solo ciò
 * che ha disponibile nel report di prova.
 */
export interface CertificationData {
  // === Identificazione ===
  certificationCode: string | null;
  certificationLab: string | null;
  certificationDate: string | null; // ISO date YYYY-MM-DD
  certificationNotes: string | null;
  // === Acustica ===
  acousticPerformance: number | null;      // Rw dB
  acousticRwC: number | null;              // C correttore rumore rosa
  acousticRwCtr: number | null;            // Ctr correttore traffico
  acousticTestNorm: string | null;         // es. "UNI EN ISO 10140-2"
  // === Fuoco ===
  fireResistanceClass: string | null;      // EI/REI (es. "EI 60")
  fireReactionClass: string | null;        // Euroclasse lastre (es. "A2-s1,d0")
  fireTestNorm: string | null;             // es. "EN 1364-1"
  // === Termica ===
  thermalPerformance: number | null;       // λ W/mK (singola lastra)
  thermalUValue: number | null;            // U globale W/m²K
  thermalRValue: number | null;            // R globale m²K/W
  // === Meccanica + peso ===
  weightPerSqm: number | null;             // kg/m² certificato
  mechanicalMaxHeightM: number | null;     // altezza max parete
  mechanicalLoadNSqm: number | null;       // carico ammissibile N/m²
  mechanicalSuspendableLoadKg: number | null; // carico max sospendibile kg/punto
}

interface UseConfiguratorStateReturn {
  // State
  id: string | null;
  name: string;
  description: string;
  isCertified: boolean;
  certification: CertificationData;
  layers: LayerV2[];
  studSpacingMm: 300 | 400 | 600;
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
  setStudSpacingMm: (spacing: 300 | 400 | 600) => void;
  addLayer: (initial?: Partial<LayerV2>) => string; // ritorna l'id del nuovo layer
  updateLayer: (id: string, patch: Partial<LayerV2>) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => string | null; // ritorna id clone (o null se sorgente non trovata)
  reorderLayers: (orderedIds: string[]) => void;
  setMaterial: (layerId: string, material: DatabaseMaterial) => void;
  /** Aggiorna i metadati certificazione (e flag is_certified). */
  setCertification: (patch: Partial<CertificationData> & { isCertified?: boolean }) => void;
  /** Variante async della save: restituisce l'id della stratigrafia salvata (o null se errore). */
  saveAsync: () => Promise<string | null>;
  /**
   * Verifica se esiste già un'altra stratigrafia con lo stesso nome
   * nell'organization corrente. Ritorna l'esistente o null. Esclude
   * automaticamente la stratigrafia corrente (in caso di edit).
   */
  checkNameConflict: () => Promise<NameConflict | null>;
  /** Override manuale della vite per un layer board. Disattiva auto-suggest per quel layer. */
  setScrewMaterial: (layerId: string, screw: DatabaseMaterial | null) => void;
  /** Aggiornamento numero viti/m² (override manuale). */
  setScrewQuantity: (layerId: string, quantity: number) => void;
  /** Rimette il flag auto-suggest a true così l'effetto ri-applica la vite raccomandata. */
  reapplyScrewSuggestion: (layerId: string) => void;
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
  initialLayers,
  initialName,
}: UseConfiguratorStateProps): UseConfiguratorStateReturn {
  const { data: loaded, isLoading, error: loadError } = useStratigraphy(stratigraphyId ?? undefined);
  const saveMutation = useIntegratedStratigraphySave();
  // Catalogo materiali per il match auto montante↔guida
  const { data: catalog = [] } = useMaterials();
  const { currentOrganizationId } = useCurrentOrganization();

  const [id, setId] = useState<string | null>(stratigraphyId ?? null);
  const [name, setNameRaw] = useState('');
  const [description, setDescriptionRaw] = useState('');
  const [isCertified, setIsCertified] = useState(false);
  const [certification, setCertificationState] = useState<CertificationData>({
    certificationCode: null,
    certificationLab: null,
    certificationDate: null,
    certificationNotes: null,
    acousticPerformance: null,
    acousticRwC: null,
    acousticRwCtr: null,
    acousticTestNorm: null,
    fireResistanceClass: null,
    fireReactionClass: null,
    fireTestNorm: null,
    thermalPerformance: null,
    thermalUValue: null,
    thermalRValue: null,
    weightPerSqm: null,
    mechanicalMaxHeightM: null,
    mechanicalLoadNSqm: null,
    mechanicalSuspendableLoadKg: null,
  });
  const [layers, setLayers] = useState<LayerV2[]>([]);
  const [studSpacingMm, setStudSpacingRaw] = useState<300 | 400 | 600>(600);
  const [isDirty, setIsDirty] = useState(false);

  // Hydrate da DB quando arriva
  useEffect(() => {
    if (!loaded) return;
    setId(loaded.id);
    setNameRaw(loaded.name ?? '');
    setDescriptionRaw(loaded.description ?? '');
    setIsCertified(Boolean((loaded as { is_certified?: boolean }).is_certified));
    const l = loaded as Record<string, unknown>;
    setCertificationState({
      certificationCode: (l.certification_code as string) ?? null,
      certificationLab: (l.certification_lab as string) ?? null,
      certificationDate: (l.certification_date as string) ?? null,
      certificationNotes: (l.certification_notes as string) ?? null,
      acousticPerformance: l.acoustic_performance != null ? Number(l.acoustic_performance) : null,
      acousticRwC: l.acoustic_rw_c_correction != null ? Number(l.acoustic_rw_c_correction) : null,
      acousticRwCtr: l.acoustic_rw_ctr_correction != null ? Number(l.acoustic_rw_ctr_correction) : null,
      acousticTestNorm: (l.acoustic_test_norm as string) ?? null,
      fireResistanceClass: (l.fire_resistance_class as string) ?? null,
      fireReactionClass: (l.fire_reaction_class as string) ?? null,
      fireTestNorm: (l.fire_test_norm as string) ?? null,
      thermalPerformance: l.thermal_performance != null ? Number(l.thermal_performance) : null,
      thermalUValue: l.thermal_u_value != null ? Number(l.thermal_u_value) : null,
      thermalRValue: l.thermal_r_value != null ? Number(l.thermal_r_value) : null,
      weightPerSqm: l.weight_per_sqm != null ? Number(l.weight_per_sqm) : null,
      mechanicalMaxHeightM: l.mechanical_max_height_m != null ? Number(l.mechanical_max_height_m) : null,
      mechanicalLoadNSqm: l.mechanical_load_n_sqm != null ? Number(l.mechanical_load_n_sqm) : null,
      mechanicalSuspendableLoadKg: l.mechanical_suspendable_load_kg != null ? Number(l.mechanical_suspendable_load_kg) : null,
    });
    const loadedSpacing = (loaded as { stud_spacing_mm?: number }).stud_spacing_mm;
    if (loadedSpacing === 300 || loadedSpacing === 400 || loadedSpacing === 600) setStudSpacingRaw(loadedSpacing);
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
      // Le stratigrafie caricate dal DB sono "frozen": l'auto-suggest non
      // sovrascrive quello che è stato salvato. L'utente può cliccare
      // "Riapplica suggerimento" per ri-attivare l'auto-fill su un layer.
      screwIsAutoSuggested: false,
    }));
    setLayers(hydrated);
    setIsDirty(false);
  }, [loaded]);

  // Hydrate "da snapshot orfano" (F5.6): solo se NON è un load di stratigrafia
  // esistente e abbiamo `initialLayers` esplicitamente passati. Marchiamo
  // subito dirty perché è una nuova bozza che va salvata.
  const initialHydratedRef = useRef(false);
  useEffect(() => {
    if (initialHydratedRef.current) return;
    if (stratigraphyId) return; // sta caricando dal catalogo
    if (!initialLayers || initialLayers.length === 0) return;
    initialHydratedRef.current = true;
    setLayers(
      initialLayers.map((l, idx) => ({
        ...l,
        id: l.id ?? newId(),
        position: l.position ?? idx + 1,
      })),
    );
    if (initialName) setNameRaw(initialName);
    // È una bozza nuova: dirty subito così "Salva" non viene confuso con
    // "stratigrafia salvata pulita".
    setIsDirty(true);
  }, [initialLayers, initialName, stratigraphyId]);

  // Tipologia + codice sistema auto-derivati
  const typology = useTypologyDetection(layers);
  const systemCode = useSystemCode({ typology, layers });

  // Suggestions viti per ogni layer board (in base a posizione/lato/categoria)
  const { suggestions: screwSuggestions } = useScrewSuggestions(layers, typology);

  // Auto-apply: per ogni layer board con `screwIsAutoSuggested !== false`
  // applico la suggestion. Rispetta override manuale (flag = false).
  useEffect(() => {
    if (screwSuggestions.size === 0) return;
    let changed = false;
    setLayers(prev => {
      const next = prev.map(l => {
        if (l.material?.category !== 'board') return l;
        // Override manuale: non toccare
        if (l.screwIsAutoSuggested === false) return l;
        const sug = screwSuggestions.get(l.id);
        if (!sug || !sug.recommended) return l;
        const newScrewId = sug.recommended.id;
        const newQty = Math.round(sug.screwsPerSqm);
        const newCost = computeScrewCostPerSqm(sug.recommended, newQty);
        // Se nessuna delle 3 cose cambia, evito update inutile (= no re-render)
        const needsChange =
          l.screwMaterialId !== newScrewId ||
          Number(l.screwQuantity ?? -1) !== newQty ||
          Math.abs(Number(l.screwCostPerSqm ?? -1) - newCost) > 0.0001;
        if (!needsChange) return l;
        changed = true;
        return {
          ...l,
          screwMaterialId: newScrewId,
          screwMaterial: sug.recommended,
          screwQuantity: newQty,
          screwCostPerSqm: newCost,
          screwIsAutoSuggested: true,
        };
      });
      return changed ? next : prev;
    });
    if (changed) setIsDirty(true);
  }, [screwSuggestions]);

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

  const setStudSpacingMm = useCallback((v: 300 | 400 | 600) => {
    setStudSpacingRaw(v);
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

  const duplicateLayer = useCallback((layerId: string): string | null => {
    let cloneId: string | null = null;
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === layerId);
      if (idx < 0) return prev;
      const source = prev[idx];
      cloneId = newId();
      const clone: LayerV2 = { ...source, id: cloneId, position: source.position + 1 };
      const next = [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
      return next.map((l, i) => ({ ...l, position: i + 1 }));
    });
    setIsDirty(true);
    return cloneId;
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
    setLayers(prev => {
      // 1) Aggiorna il layer con il materiale scelto
      const updated = prev.map(l => {
        if (l.id !== layerId) return l;
        const thickness = l.thickness > 0 ? l.thickness : Number(material.thickness) || 0;
        return { ...l, materialId: material.id, material, thickness };
      });

      // 2) Auto-suggest montante ↔ guida: quando l'utente sceglie un montante
      //    (o una guida), il sistema cerca il match per width nel catalogo.
      //    Se c'è un layer ADIACENTE VUOTO di categoria adatta lo riempie;
      //    altrimenti, INSERISCE un nuovo layer adiacente subito dopo, già
      //    pre-compilato con la guida (o il montante) abbinato.
      //    Auto-fill silente: se l'altro layer è già configurato, non tocchiamo.
      if (
        (material.category === 'structure_frame' || material.category === 'structure_guide') &&
        catalog.length > 0
      ) {
        const idx = updated.findIndex(l => l.id === layerId);
        if (idx >= 0) {
          const targetCategory = oppositeStructureCategory(material.category);
          // C'è già un layer adiacente di categoria opposta? Allora niente da fare.
          const adjacent = [updated[idx - 1], updated[idx + 1]].filter(Boolean);
          const alreadyHasOpposite = adjacent.some(
            a => a.material?.category === targetCategory,
          );
          if (!alreadyHasOpposite) {
            const match = findStructureMatch(material, catalog, targetCategory);
            if (match) {
              // Cerca un layer adiacente VUOTO (no materialId)
              const emptyAdjIdx = [idx - 1, idx + 1].find(
                i => i >= 0 && i < updated.length && !updated[i]?.materialId,
              );
              if (emptyAdjIdx !== undefined) {
                // Riempi il layer vuoto adiacente
                const adj = updated[emptyAdjIdx];
                updated[emptyAdjIdx] = {
                  ...adj,
                  materialId: match.id,
                  material: match,
                  thickness: adj.thickness > 0 ? adj.thickness : Number(match.thickness) || 0,
                };
              } else {
                // Nessun adiacente vuoto: INSERISCO un nuovo layer subito DOPO il
                // montante/guida appena scelto, pre-compilato con il match.
                const newLayer: LayerV2 = {
                  id: newId(),
                  position: idx + 2, // verrà ri-assegnato dal map sotto
                  materialId: match.id,
                  material: match,
                  thickness: Number(match.thickness) || 0,
                };
                updated.splice(idx + 1, 0, newLayer);
              }
              toast.info(
                `${targetCategory === 'structure_guide' ? 'Guida' : 'Montante'} ${match.width ?? ''}mm abbinato automaticamente.`,
                { description: match.name },
              );
            }
          }
        }
      }

      // Ricalcola le position dopo eventuali insert
      const renumbered = updated.map((l, i) => ({ ...l, position: i + 1 }));
      // Sostituisco updated con renumbered per la successiva logica isolante
      updated.splice(0, updated.length, ...renumbered);

      // 3) Se il materiale è un isolante e il layer è "orfano" (non adiacente a una
      //    struttura), proviamo a snapparlo dentro la struttura più vicina.
      //    Regola: l'isolante va SEMPRE nel vano dei montanti (UNI 11424:2015).
      if (material.category !== 'insulation') return updated;

      const idx = updated.findIndex(l => l.id === layerId);
      if (idx < 0) return updated;
      const prevCat = updated[idx - 1]?.material?.category;
      const nextCat = updated[idx + 1]?.material?.category;
      const isAdjacentToStructure = prevCat === 'structure_frame' || nextCat === 'structure_frame';
      if (isAdjacentToStructure) return updated; // già al posto giusto

      // Cerca lo structure_frame più vicino in entrambe le direzioni
      let nearestStructIdx = -1;
      let bestDistance = Infinity;
      updated.forEach((l, i) => {
        if (l.material?.category === 'structure_frame') {
          const d = Math.abs(i - idx);
          if (d < bestDistance) { bestDistance = d; nearestStructIdx = i; }
        }
      });

      if (nearestStructIdx === -1) {
        // Nessuna struttura presente: avviso, niente snap.
        toast.warning("Aggiungi prima un montante: l'isolante va inserito nel vano della struttura.");
        return updated;
      }

      // Estrai il layer isolante e reinseriscilo SUBITO DOPO lo structure_frame.
      const insulLayer = updated[idx];
      const without = [...updated.slice(0, idx), ...updated.slice(idx + 1)];
      // Ricalcola index della struttura nell'array senza l'isolante
      const newStructIdx = without.findIndex(l => l.id === updated[nearestStructIdx].id);
      const insertAt = newStructIdx + 1;
      const reordered = [...without.slice(0, insertAt), insulLayer, ...without.slice(insertAt)]
        .map((l, i) => ({ ...l, position: i + 1 }));

      toast.info("Isolante spostato nel vano della struttura (UNI 11424:2015).");
      return reordered;
    });
    setIsDirty(true);
  }, [catalog]);

  /**
   * Override manuale della vite per un layer board.
   * Disattiva l'auto-suggest per quel layer (screwIsAutoSuggested=false).
   */
  const setScrewMaterial = useCallback((layerId: string, screw: DatabaseMaterial | null) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;
      const qty = Number(l.screwQuantity ?? 0) > 0 ? Number(l.screwQuantity) : 17;
      const newCost = screw ? computeScrewCostPerSqm(screw, qty) : 0;
      return {
        ...l,
        screwMaterialId: screw?.id ?? null,
        screwMaterial: screw,
        screwQuantity: qty,
        screwCostPerSqm: newCost,
        screwIsAutoSuggested: false, // user override
      };
    }));
    setIsDirty(true);
  }, []);

  /**
   * Override manuale della quantità viti/m².
   * Mantiene la stessa vite (eventualmente già auto-suggested), ma disattiva
   * il flag così l'auto-apply non sovrascrive.
   */
  const setScrewQuantity = useCallback((layerId: string, quantity: number) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;
      const qty = Math.max(0, Math.round(quantity));
      const newCost = l.screwMaterial ? computeScrewCostPerSqm(l.screwMaterial, qty) : 0;
      return {
        ...l,
        screwQuantity: qty,
        screwCostPerSqm: newCost,
        screwIsAutoSuggested: false,
      };
    }));
    setIsDirty(true);
  }, []);

  /**
   * Aggiorna i metadati certificazione + il flag is_certified.
   * Marca la stratigrafia come dirty.
   * Patch generico: applica solo i campi presenti nel patch.
   */
  const setCertification = useCallback(
    (patch: Partial<CertificationData> & { isCertified?: boolean }) => {
      if (typeof patch.isCertified === 'boolean') setIsCertified(patch.isCertified);
      // Applica tutti i campi presenti nel patch (undefined = lascia stare)
      setCertificationState(prev => {
        const next = { ...prev };
        (Object.keys(patch) as (keyof typeof patch)[]).forEach(key => {
          if (key === 'isCertified') return;
          const value = patch[key];
          if (value !== undefined) {
            (next as Record<string, unknown>)[key as string] = value as unknown;
          }
        });
        return next;
      });
      setIsDirty(true);
    },
    [],
  );

  /**
   * Rimette il flag auto-suggest a true → l'effetto `screwSuggestions` ri-applica
   * la vite raccomandata al prossimo render.
   */
  const reapplyScrewSuggestion = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, screwIsAutoSuggested: true } : l));
    setIsDirty(true);
  }, []);

  /**
   * Check applicativo: cerca un'altra stratigrafia con lo stesso nome
   * nell'organization corrente, escludendo la stratigrafia in modifica.
   * Non c'è UNIQUE constraint a DB perché legacy potrebbe già contenere
   * duplicati e bloccherebbe il save.
   */
  const checkNameConflict = useCallback(async (): Promise<NameConflict | null> => {
    const trimmed = name.trim();
    if (!trimmed || !currentOrganizationId) return null;
    let query = supabase
      .from('stratigraphies')
      .select('id, name, is_certified')
      .eq('name', trimmed)
      .eq('organization_id', currentOrganizationId)
      .limit(1);
    if (id) query = query.neq('id', id);
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('[useConfiguratorState] checkNameConflict error:', error);
      return null;
    }
    if (!data) return null;
    return { id: data.id, name: data.name, isCertified: !!data.is_certified };
  }, [name, id, currentOrganizationId]);

  const isValidName = name.trim().length > 0;
  const hasAtLeastOneCompleteLayer = layers.some(l => l.materialId && l.thickness > 0);
  const canSave = isValidName && hasAtLeastOneCompleteLayer && !saveMutation.isPending;

  /** Costruisce il payload condiviso tra `save` e `saveAsync`. */
  const buildSavePayload = useCallback(() => {
    // Mappa typology V2 → WallType del save (V1 type system)
    const typeMap: Record<string, 'plating' | 'counterwall' | 'single' | 'double' | 'ceiling'> = {
      partition: 'single',
      lining: 'counterwall',
      ceiling: 'ceiling',
      unknown: 'single',
    };
    return {
      id: id ?? undefined,
      name: name.trim(),
      description,
      type: typeMap[typology] ?? 'single',
      estimatedCost: 0, // calcolo interno del save lo sovrascrive con i totali corretti
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
      weightPerSqm: certification.weightPerSqm ?? 0,
      studSpacingMm,
      isCertified,
      certificationCode: certification.certificationCode,
      certificationLab: certification.certificationLab,
      certificationDate: certification.certificationDate,
      certificationNotes: certification.certificationNotes,
      acousticPerformance: certification.acousticPerformance,
      acousticRwC: certification.acousticRwC,
      acousticRwCtr: certification.acousticRwCtr,
      acousticTestNorm: certification.acousticTestNorm,
      fireResistanceClass: certification.fireResistanceClass,
      fireReactionClass: certification.fireReactionClass,
      fireTestNorm: certification.fireTestNorm,
      thermalPerformance: certification.thermalPerformance,
      thermalUValue: certification.thermalUValue,
      thermalRValue: certification.thermalRValue,
      mechanicalMaxHeightM: certification.mechanicalMaxHeightM,
      mechanicalLoadNSqm: certification.mechanicalLoadNSqm,
      mechanicalSuspendableLoadKg: certification.mechanicalSuspendableLoadKg,
    };
  }, [id, name, description, typology, layers, totalThicknessMm, studSpacingMm, isCertified, certification]);

  const save = useCallback(() => {
    if (!canSave) {
      if (!isValidName) toast.error('Inserisci un nome per la stratigrafia');
      else toast.error('Aggiungi almeno un layer completo prima di salvare');
      return;
    }

    saveMutation.mutate(buildSavePayload(), {
      onSuccess: (res) => {
        setIsDirty(false);
        // useIntegratedStratigraphySave ritorna la row di stratigraphies
        // direttamente (con .id), non un wrapper con .stratigraphyId.
        if (res?.id && !id) setId(res.id);
      },
    });
  }, [canSave, isValidName, saveMutation, id, buildSavePayload]);

  /**
   * Variante async della save: restituisce l'ID della stratigrafia salvata
   * (utile per chaining "salva → fai qualcos'altro con l'ID", es. "salva e
   * aggiungi a preventivo" senza dover aspettare un re-render).
   *
   * Se la stratigrafia non è dirty e ha già un id, ritorna direttamente l'id
   * senza salvare.
   */
  const saveAsync = useCallback(async (): Promise<string | null> => {
    // Già salvata pulita → ritorna l'id corrente
    if (id && !isDirty) return id;
    if (!canSave) {
      if (!isValidName) toast.error('Inserisci un nome per la stratigrafia');
      else toast.error('Aggiungi almeno un layer completo prima di salvare');
      return null;
    }
    try {
      const res = await saveMutation.mutateAsync(buildSavePayload());
      // useIntegratedStratigraphySave ritorna la row con .id (non .stratigraphyId).
      const newId = (res as { id?: string } | undefined)?.id ?? id;
      if (newId && !id) setId(newId);
      setIsDirty(false);
      return newId ?? null;
    } catch (err) {
      console.error('[useConfiguratorState] saveAsync error:', err);
      const message = (err as Error)?.message ?? 'Errore durante il salvataggio.';
      toast.error(`Errore salvataggio: ${message}`);
      return null;
    }
  }, [canSave, isValidName, isDirty, saveMutation, id, buildSavePayload]);

  return {
    id,
    name,
    description,
    isCertified,
    certification,
    layers,
    studSpacingMm,
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
    setStudSpacingMm,
    addLayer,
    updateLayer,
    removeLayer,
    duplicateLayer,
    reorderLayers,
    setMaterial,
    setCertification,
    saveAsync,
    checkNameConflict,
    setScrewMaterial,
    setScrewQuantity,
    reapplyScrewSuggestion,
    save,
    canSave,
  };
}
