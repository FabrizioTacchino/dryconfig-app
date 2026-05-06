
import { useMemo } from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';

interface UseIntegratedScrewSelectionProps {
  boardMaterial?: DatabaseMaterial;
  allMaterials: DatabaseMaterial[];
}

export const useIntegratedScrewSelection = ({
  boardMaterial,
  allMaterials
}: UseIntegratedScrewSelectionProps) => {
  const screwMaterials = useMemo(() => {
    return allMaterials.filter(material => material.category === 'screw');
  }, [allMaterials]);

  const suggestedScrew = useMemo(() => {
    if (!boardMaterial || boardMaterial.category !== 'board') {
      return null;
    }

    console.log('[useIntegratedScrewSelection] 🔍 RICERCA VITE AUTOMATICA per:', {
      boardName: boardMaterial.name,
      boardThickness: boardMaterial.thickness,
      boardType: boardMaterial.board_type,
      availableScrews: screwMaterials.length
    });

    // Logica di selezione automatica della vite
    const compatibleScrews = screwMaterials.filter(screw => {
      // Verifica compatibilità con board_type se presente
      if (boardMaterial.board_type && screw.compatible_board_types) {
        return screw.compatible_board_types.includes(boardMaterial.board_type);
      }
      return true;
    });

    console.log('[useIntegratedScrewSelection] 🔧 VITI COMPATIBILI:', {
      totalCompatible: compatibleScrews.length,
      screwNames: compatibleScrews.map(s => s.name)
    });

    // Se ci sono viti compatibili, prendi la prima (o implementa logica più sofisticata)
    if (compatibleScrews.length > 0) {
      const selectedScrew = compatibleScrews[0];
      console.log('[useIntegratedScrewSelection] ✅ VITE SELEZIONATA:', {
        screwName: selectedScrew.name,
        screwCode: selectedScrew.code,
        unitPrice: selectedScrew.unit_price
      });
      return selectedScrew;
    }

    // Fallback: se non ci sono viti compatibili, prendi la prima vite disponibile
    if (screwMaterials.length > 0) {
      console.log('[useIntegratedScrewSelection] ⚠️ NESSUNA VITE COMPATIBILE, uso fallback:', screwMaterials[0].name);
      return screwMaterials[0];
    }

    console.log('[useIntegratedScrewSelection] ❌ NESSUNA VITE DISPONIBILE');
    return null;
  }, [boardMaterial, screwMaterials]);

  const getDefaultScrewQuantity = useMemo(() => {
    // Quantità standard in base al tipo di lastra
    if (boardMaterial?.board_type) {
      switch (boardMaterial.board_type.toLowerCase()) {
        case 'gypsum':
        case 'plasterboard':
          return 25; // 25 viti per m² per lastre in gesso
        case 'wood':
        case 'osb':
          return 20; // 20 viti per m² per legno/OSB
        case 'cement':
        case 'fiber_cement':
          return 30; // 30 viti per m² per cemento fibrato
        default:
          return 25; // Default generico
      }
    }
    return 25; // Default se non specificato
  }, [boardMaterial]);

  return {
    screwMaterials,
    suggestedScrew,
    getDefaultScrewQuantity
  };
};
