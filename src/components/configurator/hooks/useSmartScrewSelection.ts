import { DatabaseMaterial } from '@/hooks/useMaterials';
import { useScrewRecommendation } from './useScrewRecommendation';

interface UseSmartScrewSelectionProps {
  boardMaterial?: DatabaseMaterial;
  allMaterials: DatabaseMaterial[];
  totalBoardLayers: number;
  /** 1-based: 1 = primo strato (più vicino alla struttura) */
  currentLayerPosition: number;
  /** Spessore singolo del layer (mm), opzionale */
  currentLayerThicknessMm?: number;
  /** Spessore pacchetto totale (mm), opzionale */
  totalThicknessMm?: number;
}

/**
 * Wrapper retrocompatibile attorno a useScrewRecommendation.
 *
 * Differenze chiave rispetto alla versione precedente:
 *  - Nessun fallback "tutte le viti del catalogo": screwMaterials contiene solo
 *    candidati realmente utili (compatibili per board type AND length sufficiente).
 *  - Match board_type case-insensitive + trim (matching board_type ↔ compatible_board_types).
 *  - Quantità per m² guidata da screw_spacing_rules (UNI 11424 / Knauf D11).
 */
export const useSmartScrewSelection = ({
  boardMaterial,
  allMaterials,
  totalBoardLayers,
  currentLayerPosition,
  currentLayerThicknessMm,
  totalThicknessMm,
}: UseSmartScrewSelectionProps) => {
  const rec = useScrewRecommendation({
    boardMaterial: boardMaterial ?? null,
    allMaterials,
    totalBoardLayers,
    currentLayerPosition,
    currentLayerThicknessMm,
    totalThicknessMm,
  });

  // screwMaterials esposto al chiamante: candidati (compatibili per type+length).
  // Se non ci sono candidati con length sufficiente, esponi compatibili-per-type
  // (non tutti i 16+ del catalogo) così l'utente ha comunque opzioni utili.
  const screwMaterials = rec.candidates.length > 0 ? rec.candidates : rec.byBoardType;

  return {
    screwMaterials,
    suggestedScrew: rec.recommended,
    suggestedQuantity: Math.round(rec.screwsPerSqm),
    // Extra info esposti per chi vuole mostrare la motivazione nella UI.
    recommendation: rec,
  };
};
