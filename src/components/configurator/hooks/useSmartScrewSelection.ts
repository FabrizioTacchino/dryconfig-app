
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { useScrewSettings } from '@/hooks/useScrewSettings';
import { useConfiguratorSettings } from '@/hooks/useConfiguratorSettings';

interface UseSmartScrewSelectionProps {
  boardMaterial?: DatabaseMaterial;
  allMaterials: DatabaseMaterial[];
  totalBoardLayers: number;
  currentLayerPosition: number; // 1 = closest to structure, 2 = intermediate, 3 = external
}

// IMPROVED: Enhanced mapping function to correctly handle cement-based boards like Aquaroc
const mapBoardTypeToCategory = (boardMaterial: DatabaseMaterial | undefined): string => {
  if (!boardMaterial) return 'gesso_rivestito'; // default fallback
  
  const boardType = boardMaterial.board_type;
  const materialName = boardMaterial.name?.toLowerCase() || '';
  const materialType = boardMaterial.material_type?.toLowerCase() || '';
  
  console.log('[mapBoardTypeToCategory] 🔍 ENHANCED ANALYSIS:', {
    materialName: boardMaterial.name,
    boardType,
    materialType,
    category: boardMaterial.category
  });
  
  // PRIORITY 1: Check for cement-based materials (Aquaroc, fibrocemento, etc.)
  if (boardType && boardType.toLowerCase().includes('cement')) {
    console.log('[mapBoardTypeToCategory] ✅ MAPPED TO cemento_fibroarmato (by board_type: cement)');
    return 'cemento_fibroarmato';
  }
  
  if (materialName.includes('aquaroc') || 
      materialName.includes('fibrocemento') ||
      materialName.includes('cemento')) {
    console.log('[mapBoardTypeToCategory] ✅ MAPPED TO cemento_fibroarmato (by name)');
    return 'cemento_fibroarmato';
  }
  
  if (materialType.includes('cemento') || 
      materialType.includes('fibrocemento') ||
      materialType === 'cemento_fibroarmato') {
    console.log('[mapBoardTypeToCategory] ✅ MAPPED TO cemento_fibroarmato (by material_type)');
    return 'cemento_fibroarmato';
  }
  
  // PRIORITY 2: Check for silicate materials
  if (boardType && boardType.toLowerCase().includes('silicate')) {
    console.log('[mapBoardTypeToCategory] ✅ MAPPED TO silicato (by board_type)');
    return 'silicato';
  }
  
  if (materialName.includes('silicato') || materialType.includes('silicato')) {
    console.log('[mapBoardTypeToCategory] ✅ MAPPED TO silicato (by name/type)');
    return 'silicato';
  }
  
  // PRIORITY 3: Check for standard gypsum boards
  if (materialName.includes('habito') || 
      materialName.includes('activ') || 
      materialName.includes('gesso') ||
      materialName.includes('cartongesso') ||
      materialName.includes('gyproc') ||
      materialName.includes('knauf')) {
    console.log('[mapBoardTypeToCategory] ✅ MAPPED TO gesso_rivestito (by name)');
    return 'gesso_rivestito';
  }
  
  // PRIORITY 4: Check board_type field for gypsum
  if (boardType) {
    const normalizedType = boardType.toLowerCase();
    
    if (normalizedType.includes('gesso') || 
        normalizedType.includes('cartongesso') ||
        normalizedType.includes('gypsum') ||
        normalizedType.includes('standard') ||
        normalizedType.includes('ignifuga')) {
      console.log('[mapBoardTypeToCategory] ✅ MAPPED TO gesso_rivestito (by board_type)');
      return 'gesso_rivestito';
    }
  }
  
  // PRIORITY 5: Check material_type field
  if (materialType.includes('gesso') || materialType === 'gesso_rivestito') {
    console.log('[mapBoardTypeToCategory] ✅ MAPPED TO gesso_rivestito (by material_type)');
    return 'gesso_rivestito';
  }
  
  // Default fallback - most construction boards are gesso rivestito
  console.log('[mapBoardTypeToCategory] ⚠️ USING DEFAULT FALLBACK: gesso_rivestito');
  return 'gesso_rivestito';
};

export const useSmartScrewSelection = ({
  boardMaterial,
  allMaterials,
  totalBoardLayers,
  currentLayerPosition
}: UseSmartScrewSelectionProps) => {
  
  const { getScrewConfigs } = useConfiguratorSettings();
  const { getScrewQuantitySettings } = useScrewSettings();

  // Load screw configurations and quantity settings
  const { data: screwConfigs = [] } = useQuery({
    queryKey: ['screw-configs'],
    queryFn: getScrewConfigs
  });

  const { data: quantitySettings = [] } = useQuery({
    queryKey: ['screw-quantity-settings'],
    queryFn: getScrewQuantitySettings
  });

  // Calculate mapped board type once for reuse
  const mappedBoardType = useMemo(() => {
    const result = boardMaterial ? mapBoardTypeToCategory(boardMaterial) : null;
    console.log('[useSmartScrewSelection] 🎯 FINAL BOARD TYPE MAPPING:', {
      boardName: boardMaterial?.name,
      originalBoardType: boardMaterial?.board_type,
      originalMaterialType: boardMaterial?.material_type,
      mappedTo: result
    });
    return result;
  }, [boardMaterial]);

  const screwMaterials = useMemo(() => {
    const allScrews = allMaterials.filter(material => material.category === 'screw');
    
    // If no board material, return all screws
    if (!mappedBoardType) {
      console.log('[useSmartScrewSelection] 🔧 NO BOARD TYPE - returning all screws');
      return allScrews;
    }

    // Filter screws by compatibility with the mapped board type
    const compatibleScrews = allScrews.filter(screw => {
      const isCompatible = screw.compatible_board_types && 
        Array.isArray(screw.compatible_board_types) &&
        screw.compatible_board_types.includes(mappedBoardType);
      
      if (isCompatible) {
        console.log('[useSmartScrewSelection] ✅ COMPATIBLE SCREW FOUND:', {
          screwName: screw.name,
          screwCode: screw.code,
          compatibleTypes: screw.compatible_board_types,
          boardType: mappedBoardType
        });
      }
      
      return isCompatible;
    });

    console.log('[useSmartScrewSelection] 🔧 SCREW FILTERING RESULTS:', {
      boardName: boardMaterial?.name,
      mappedBoardType,
      totalScrews: allScrews.length,
      compatibleScrews: compatibleScrews.length,
      compatibleScrewNames: compatibleScrews.map(s => s.name)
    });

    // If no compatible screws found, fall back to all screws with warning
    if (compatibleScrews.length === 0) {
      console.warn('[useSmartScrewSelection] ⚠️ NO COMPATIBLE SCREWS FOUND - falling back to all screws');
      return allScrews;
    }

    return compatibleScrews;
  }, [allMaterials, mappedBoardType, boardMaterial?.name]);

  const suggestedScrew = useMemo(() => {
    if (!boardMaterial || boardMaterial.category !== 'board') {
      return null;
    }

    console.log('[useSmartScrewSelection] 🔍 SMART SCREW SELECTION:', {
      boardName: boardMaterial.name,
      originalBoardType: boardMaterial.board_type,
      mappedType: mappedBoardType,
      totalBoardLayers,
      currentPosition: currentLayerPosition,
      availableScrewConfigs: screwConfigs.length,
      availableCompatibleScrews: screwMaterials.length
    });

    // Use currentLayerPosition instead of totalBoardLayers for screw selection
    const effectivePlatesCount = currentLayerPosition === 1 ? 1 : totalBoardLayers;

    // Find the appropriate screw configuration
    const appropriateConfig = screwConfigs.find(config => 
      config.plates_count === effectivePlatesCount &&
      config.compatible_board_types.includes(mappedBoardType!)
    );

    console.log('[useSmartScrewSelection] 🔧 CONFIG SEARCH RESULTS:', {
      foundConfig: !!appropriateConfig,
      configCode: appropriateConfig?.screw_code,
      configCompatibleTypes: appropriateConfig?.compatible_board_types,
      searchedFor: { 
        plates_count: effectivePlatesCount, 
        board_type: mappedBoardType,
        currentPosition: currentLayerPosition
      }
    });

    if (appropriateConfig) {
      // Find the screw material that matches the configuration code
      const matchingScrew = screwMaterials.find(screw => 
        screw.code === appropriateConfig.screw_code
      );

      if (matchingScrew) {
        console.log('[useSmartScrewSelection] ✅ FOUND PERFECT MATCH:', {
          configCode: appropriateConfig.screw_code,
          screwName: matchingScrew.name,
          effectivePlatesCount,
          currentPosition: currentLayerPosition,
          compatibleTypes: appropriateConfig.compatible_board_types
        });
        return matchingScrew;
      }
    }

    // Fallback 1: Filter screws by board type compatibility and prefer by position
    if (screwMaterials.length > 0) {
      // For first layer, prefer shorter screws (TN25)
      // For subsequent layers, prefer longer screws
      const preferredScrew = currentLayerPosition === 1 
        ? screwMaterials.find(s => s.code?.includes('TN25')) || screwMaterials[0]
        : screwMaterials.find(s => s.code?.includes('TN35') || s.code?.includes('TN45')) || screwMaterials[0];

      console.log('[useSmartScrewSelection] 🎯 FOUND COMPATIBLE SCREW (FALLBACK 1):', {
        screwName: preferredScrew.name,
        screwCode: preferredScrew.code,
        compatibleTypes: preferredScrew.compatible_board_types,
        mappedBoardType,
        currentPosition: currentLayerPosition,
        totalCompatible: screwMaterials.length
      });
      return preferredScrew;
    }

    // Fallback 2: If no compatible screws, use naming convention
    const allScrews = allMaterials.filter(material => material.category === 'screw');
    let fallbackScrewCode = '';
    
    if (mappedBoardType === 'gesso_rivestito') {
      fallbackScrewCode = currentLayerPosition === 1 ? 'TN25' : (totalBoardLayers === 2 ? 'TN35' : 'TN45');
    } else if (mappedBoardType === 'cemento_fibroarmato') {
      fallbackScrewCode = currentLayerPosition === 1 ? 'TN25' : 'TN55';
    } else {
      fallbackScrewCode = currentLayerPosition === 1 ? 'TN25' : 'TN35';
    }

    const fallbackScrew = allScrews.find(screw => 
      screw.code?.toUpperCase().includes(fallbackScrewCode)
    );

    if (fallbackScrew) {
      console.log('[useSmartScrewSelection] ⚠️ USING NAMING FALLBACK:', {
        fallbackCode: fallbackScrewCode,
        screwName: fallbackScrew.name,
        mappedBoardType,
        currentPosition: currentLayerPosition,
        reason: 'No config or compatible screw found'
      });
    } else {
      console.warn('[useSmartScrewSelection] ❌ NO SCREW FOUND AT ALL:', {
        mappedBoardType,
        totalBoardLayers,
        currentPosition: currentLayerPosition,
        fallbackScrewCode,
        availableScrews: allScrews.map(s => ({ code: s.code, name: s.name }))
      });
    }

    return fallbackScrew || null;
  }, [boardMaterial, screwMaterials, totalBoardLayers, currentLayerPosition, screwConfigs, mappedBoardType, allMaterials]);

  const suggestedQuantity = useMemo(() => {
    // Find quantity setting for the current position
    const quantitySetting = quantitySettings.find(setting => 
      setting.position_in_block === currentLayerPosition
    );

    if (quantitySetting) {
      console.log('[useSmartScrewSelection] 📊 QUANTITY FROM SETTINGS:', {
        position: currentLayerPosition,
        quantity: quantitySetting.quantity_per_sqm,
        description: quantitySetting.description
      });
      return quantitySetting.quantity_per_sqm;
    }

    // Fallback: 6 for first position, 12 for others
    const fallbackQuantity = currentLayerPosition === 1 ? 6 : 12;
    console.log('[useSmartScrewSelection] ⚠️ USING FALLBACK QUANTITY:', {
      position: currentLayerPosition,
      quantity: fallbackQuantity
    });
    
    return fallbackQuantity;
  }, [currentLayerPosition, quantitySettings]);

  console.log('[useSmartScrewSelection] 🎯 FINAL ENHANCED SUGGESTION:', {
    boardName: boardMaterial?.name,
    boardType: boardMaterial?.board_type,
    materialType: boardMaterial?.material_type,
    mappedType: mappedBoardType,
    suggestedScrewName: suggestedScrew?.name,
    suggestedScrewCode: suggestedScrew?.code,
    suggestedQuantity,
    forPosition: currentLayerPosition,
    totalLayers: totalBoardLayers,
    compatibleScrewsCount: screwMaterials.length
  });

  return {
    screwMaterials,
    suggestedScrew,
    suggestedQuantity
  };
};
