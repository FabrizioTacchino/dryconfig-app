import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseMaterial } from '@/hooks/useMaterials';

export type BoardCategory =
  | 'gesso_rivestito'
  | 'gessofibra'
  | 'cemento_fibroarmato'
  | 'silicato';

export type SupportType = 'metal_thin' | 'metal_thick' | 'wood';
export type WallType = 'partition' | 'lining' | 'ceiling';
export type LayerPositionRole =
  | 'single'
  | 'first_provisional'
  | 'intermediate'
  | 'final_visible';

export interface ScrewLengthRule {
  id: string;
  board_type: string;
  support_type: SupportType;
  min_total_thickness_mm: number;
  max_total_thickness_mm: number;
  min_penetration_mm: number;
  recommended_length_mm: number;
  preferred_codes: string[];
  notes: string | null;
}

export interface ScrewSpacingRule {
  id: string;
  wall_type: WallType;
  layer_position: LayerPositionRole;
  board_type: string;
  spacing_field_mm: number;
  spacing_edge_mm: number;
  screws_per_sqm: number;
  staggered: boolean;
  notes: string | null;
}

export interface ScrewRecommendation {
  /** Vite preferita */
  recommended: DatabaseMaterial | null;
  /** Viti candidate (compatibili per board type AND length sufficiente) */
  candidates: DatabaseMaterial[];
  /** Viti compatibili per board type, di qualsiasi lunghezza (per fallback UI) */
  byBoardType: DatabaseMaterial[];
  /** Tutte le viti del catalogo (ultima spiaggia per UI manuale) */
  allScrews: DatabaseMaterial[];
  /** Densità viti suggerita */
  screwsPerSqm: number;
  /** Lunghezza minima richiesta (mm) */
  requiredLength: number;
  /** Lunghezza raccomandata dalla regola */
  recommendedLength: number;
  /** Spessore pacchetto totale considerato (mm) */
  totalThicknessMm: number;
  /** Categoria board mappata */
  mappedBoardType: BoardCategory;
  /** Posizione layer (single/first/intermediate/final) */
  layerPositionRole: LayerPositionRole;
  /** Frase pronta per UI: "Pacchetto 25 mm → vite ≥ 35 mm (UNI 11424)" */
  reason: string;
  /** Note tecniche dalla regola */
  ruleNotes: string | null;
  /** Avvertenze: ['no-rule-found', 'no-compatible-screw', ...] */
  warnings: string[];
}

const SUPPORT_DEFAULT: SupportType = 'metal_thin';
const PENETRATION_MM = 10;

const norm = (s: string | null | undefined) =>
  String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const hasAny = (haystack: string, needles: string[]) =>
  needles.some(n => haystack.includes(n));

/** Mappa flessibile di board_type / material_type / nome verso categoria standard. */
export function mapBoardTypeToCategory(
  boardMaterial?: Pick<DatabaseMaterial, 'board_type' | 'material_type' | 'name' | 'category'> | null
): BoardCategory {
  if (!boardMaterial) return 'gesso_rivestito';
  const bt = norm(boardMaterial.board_type);
  const mt = norm(boardMaterial.material_type);
  const nm = norm(boardMaterial.name);

  // Cementizia
  if (
    hasAny(bt, ['cement', 'fibrocemento', 'cementiz']) ||
    hasAny(mt, ['cement', 'fibrocemento']) ||
    hasAny(nm, ['aquaroc', 'aquapanel', 'cementizia', 'fibrocemento', 'cementiz'])
  ) return 'cemento_fibroarmato';

  // Silicato
  if (
    hasAny(bt, ['silicat']) ||
    hasAny(mt, ['silicat']) ||
    hasAny(nm, ['silicato', 'silicate', 'promat', 'aestuver'])
  ) return 'silicato';

  // Gessofibra (Fermacell, Rigidur)
  if (
    hasAny(bt, ['gessofibra', 'fibre', 'gypsum fibre']) ||
    hasAny(mt, ['gessofibra']) ||
    hasAny(nm, ['fermacell', 'rigidur'])
  ) return 'gessofibra';

  // Default: gesso rivestito (cartongesso classico)
  return 'gesso_rivestito';
}

interface UseScrewRecommendationProps {
  boardMaterial?: DatabaseMaterial | null;
  allMaterials: DatabaseMaterial[];
  /** Indice 1-based del layer board corrente nel pacchetto (1 = primo strato) */
  currentLayerPosition: number;
  /** Numero totale di layer board nel pacchetto */
  totalBoardLayers: number;
  /** Spessore singolo del layer board corrente in mm (se diverso dal default) */
  currentLayerThicknessMm?: number;
  /** Spessore totale del pacchetto board in mm (se calcolato a monte). Se omesso, somma dai material thickness. */
  totalThicknessMm?: number;
  wallType?: WallType;
  supportType?: SupportType;
}

/** Helper: deriva layer_position_role da (currentPosition, totalLayers) */
export function derivePosition(currentPosition: number, totalLayers: number): LayerPositionRole {
  if (totalLayers <= 1) return 'single';
  if (currentPosition === totalLayers) return 'final_visible';
  if (currentPosition === 1) return 'first_provisional';
  return 'intermediate';
}

/** Hook principale: calcola la raccomandazione vite per un layer board. */
export function useScrewRecommendation({
  boardMaterial,
  allMaterials,
  currentLayerPosition,
  totalBoardLayers,
  currentLayerThicknessMm,
  totalThicknessMm,
  wallType = 'partition',
  supportType = SUPPORT_DEFAULT,
}: UseScrewRecommendationProps): ScrewRecommendation {
  const mappedBoardType = useMemo(
    () => mapBoardTypeToCategory(boardMaterial),
    [boardMaterial]
  );

  const layerPositionRole = useMemo(
    () => derivePosition(currentLayerPosition, totalBoardLayers),
    [currentLayerPosition, totalBoardLayers]
  );

  // Spessore pacchetto totale (mm) — dato dall'utente o stimato
  const effectiveTotalThickness = useMemo(() => {
    if (typeof totalThicknessMm === 'number' && totalThicknessMm > 0) {
      return totalThicknessMm;
    }
    const single = currentLayerThicknessMm ?? boardMaterial?.thickness ?? 12.5;
    return Math.max(single, single * Math.max(1, totalBoardLayers));
  }, [totalThicknessMm, currentLayerThicknessMm, boardMaterial?.thickness, totalBoardLayers]);

  const { data: lengthRules = [] } = useQuery<ScrewLengthRule[]>({
    queryKey: ['screw_length_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('screw_length_rules' as never)
        .select('*');
      if (error) throw error;
      return (data as unknown as ScrewLengthRule[]) ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: spacingRules = [] } = useQuery<ScrewSpacingRule[]>({
    queryKey: ['screw_spacing_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('screw_spacing_rules' as never)
        .select('*');
      if (error) throw error;
      return (data as unknown as ScrewSpacingRule[]) ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const allScrews = useMemo(
    () => allMaterials.filter(m => m.category === 'screw'),
    [allMaterials]
  );

  // Compatibilità per categoria board (matching case-insensitive + trim)
  const byBoardType = useMemo(() => {
    return allScrews.filter(s => {
      const types = Array.isArray(s.compatible_board_types)
        ? s.compatible_board_types.map(t => norm(t))
        : [];
      return types.includes(mappedBoardType);
    });
  }, [allScrews, mappedBoardType]);

  // Trova regola lunghezza
  const lengthRule = useMemo<ScrewLengthRule | null>(() => {
    const match = lengthRules.find(
      r =>
        r.board_type === mappedBoardType &&
        r.support_type === supportType &&
        Number(effectiveTotalThickness) >= Number(r.min_total_thickness_mm) &&
        Number(effectiveTotalThickness) <= Number(r.max_total_thickness_mm)
    );
    return match ?? null;
  }, [lengthRules, mappedBoardType, supportType, effectiveTotalThickness]);

  const recommendedLength = lengthRule?.recommended_length_mm
    ?? Math.ceil((effectiveTotalThickness + PENETRATION_MM) / 5) * 5;
  const requiredLength = effectiveTotalThickness + PENETRATION_MM;

  // Candidate = compatibili per board type AND length sufficiente
  const candidates = useMemo(() => {
    return byBoardType
      .filter(s => Number(s.length ?? s.thickness ?? 0) >= requiredLength - 0.001)
      .sort((a, b) => Number(a.length ?? 0) - Number(b.length ?? 0));
  }, [byBoardType, requiredLength]);

  // Selezione raccomandata: prima match con preferred_codes, poi candidato più corto
  const recommended = useMemo<DatabaseMaterial | null>(() => {
    if (lengthRule?.preferred_codes?.length) {
      for (const code of lengthRule.preferred_codes) {
        const match = candidates.find(s => norm(s.code) === norm(code));
        if (match) return match;
      }
    }
    return candidates[0] ?? null;
  }, [lengthRule, candidates]);

  // Spacing rule -> screws_per_sqm
  const spacingRule = useMemo<ScrewSpacingRule | null>(() => {
    return (
      spacingRules.find(
        r =>
          r.wall_type === wallType &&
          r.layer_position === layerPositionRole &&
          r.board_type === mappedBoardType
      ) ??
      // Fallback: stesso wall_type + layer_position su gesso_rivestito
      spacingRules.find(
        r =>
          r.wall_type === wallType &&
          r.layer_position === layerPositionRole &&
          r.board_type === 'gesso_rivestito'
      ) ??
      null
    );
  }, [spacingRules, wallType, layerPositionRole, mappedBoardType]);

  const screwsPerSqm = Number(spacingRule?.screws_per_sqm ?? (layerPositionRole === 'first_provisional' ? 6 : 17));

  // Reason testuale
  const reason = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Pacchetto ${effectiveTotalThickness.toFixed(1)} mm`);
    parts.push(`vite ≥ ${recommendedLength} mm`);
    if (lengthRule?.notes) parts.push(lengthRule.notes);
    if (layerPositionRole === 'first_provisional') {
      parts.push('1° strato (provvisorio, interasse largo)');
    } else if (layerPositionRole === 'final_visible') {
      parts.push('strato finale a vista');
    }
    return parts.join(' · ');
  }, [effectiveTotalThickness, recommendedLength, lengthRule, layerPositionRole]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!lengthRule) w.push('no-rule-found');
    if (byBoardType.length === 0) w.push('no-compatible-by-type');
    if (candidates.length === 0) w.push('no-candidate-with-length');
    if (!recommended) w.push('no-recommended');
    return w;
  }, [lengthRule, byBoardType, candidates, recommended]);

  return {
    recommended,
    candidates,
    byBoardType,
    allScrews,
    screwsPerSqm,
    requiredLength,
    recommendedLength,
    totalThicknessMm: effectiveTotalThickness,
    mappedBoardType,
    layerPositionRole,
    reason,
    ruleNotes: lengthRule?.notes ?? null,
    warnings,
  };
}
