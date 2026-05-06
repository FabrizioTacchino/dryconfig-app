
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WallType } from '@/types';
import { UnifiedStratigraphy, SortField, SortDirection } from './types';
import { filterStratigraphies } from './filtering';
import { sortStratigraphies } from './sorting';
import { useUpdateGeneralStratigraphyPrices } from '@/hooks/useUpdateGeneralStratigraphyPrices';

export const useUnifiedStratigraphies = (wallType: WallType | 'all' = 'all', editingStratigraphy?: any) => {
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [fireResistance, setFireResistance] = useState('');
  const [acousticReduction, setAcousticReduction] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [thicknessRange, setThicknessRange] = useState('');
  const [showCertifiedOnly, setShowCertifiedOnly] = useState(false);
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: rawStratigraphies = [], isLoading, error } = useQuery({
    queryKey: ['unified-stratigraphies'],
    queryFn: async () => {
      console.log('[useUnifiedStratigraphies] 🔍 Fetching stratigraphies con accessori separati...');
      
      const { data: stratigraphies, error } = await supabase
        .from('stratigraphies')
        .select(`
          *,
          layers (
            *,
            materials!layers_material_id_fkey (*),
            screw_materials:materials!layers_screw_material_id_fkey (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useUnifiedStratigraphies] ❌ Error fetching stratigraphies:', error);
        throw error;
      }

      console.log('[useUnifiedStratigraphies] ✅ Fetched stratigraphies:', stratigraphies?.length);

      // Process each stratigraphy usando i nuovi campi comprensivi con accessori separati
      const processedStratigraphies = stratigraphies?.map(stratigraphy => {
        const processedLayers = stratigraphy.layers?.map(layer => ({
          ...layer,
          material: layer.materials,
          screwMaterial: layer.screw_materials,
          // Compatibility mappings
          materialId: layer.material_id,
          screwMaterialId: layer.screw_material_id,
          screwQuantity: layer.screw_quantity,
          screwCostPerSqm: layer.screw_cost_per_sqm,
          category: layer.materials?.category || 'board',
          interAxis: layer.inter_axis,
          calculatedCostPerSqm: 0
        })) || [];

        // 🎯 USA SEMPRE E SOLO IL comprehensive_cost_per_sqm DAL DATABASE
        const comprehensiveCostFromDB = stratigraphy.comprehensive_cost_per_sqm || 0;

        console.log(`[useUnifiedStratigraphies] 🔥 COSTI REALI DAI LAYERS - ${stratigraphy.name}:`, {
          comprehensive_cost_per_sqm: stratigraphy.comprehensive_cost_per_sqm,
          material_cost_per_sqm: stratigraphy.material_cost_per_sqm,
          screw_cost_per_sqm: stratigraphy.screw_cost_per_sqm,
          labor_cost_per_sqm: stratigraphy.labor_cost_per_sqm
        });

        return {
          ...stratigraphy,
          layers: processedLayers,
          // 🔥 USA SEMPRE IL COSTO COMPRENSIVO DAL DATABASE
          cost_per_sqm: comprehensiveCostFromDB,
          // Mappa tutti i campi del costo comprensivo (solo valori reali dai layers)
          comprehensive_cost_per_sqm: comprehensiveCostFromDB,
          material_cost_per_sqm: stratigraphy.material_cost_per_sqm || 0,
          screw_cost_per_sqm: stratigraphy.screw_cost_per_sqm || 0,
          labor_cost_per_sqm: stratigraphy.labor_cost_per_sqm || 0,
          // Compatibility camelCase
          comprehensiveCostPerSqm: comprehensiveCostFromDB,
          materialCostPerSqm: stratigraphy.material_cost_per_sqm || 0,
          screwCostPerSqm: stratigraphy.screw_cost_per_sqm || 0,
          laborCostPerSqm: stratigraphy.labor_cost_per_sqm || 0,
          // Store original for reference
          original_cost_per_sqm: stratigraphy.cost_per_sqm,
          // Compatibility
          supplier_name: stratigraphy.description || 'Custom'
        };
      }) || [];

      console.log('[useUnifiedStratigraphies] 🎉 Stratigrafie processate con accessori separati');
      return processedStratigraphies as UnifiedStratigraphy[];
    },
  });

  // Filtered and sorted stratigraphies
  const stratigraphies = useMemo(() => {
    let filtered = filterStratigraphies(rawStratigraphies, {
      wallType,
      searchTerm,
      materialSearchTerm,
      fireResistance,
      acousticReduction,
      supplierName,
      thicknessRange,
      showCertifiedOnly,
      showCustomOnly
    });

    return sortStratigraphies(filtered, sortField, sortDirection);
  }, [
    rawStratigraphies,
    wallType,
    searchTerm,
    materialSearchTerm,
    fireResistance,
    acousticReduction,
    supplierName,
    thicknessRange,
    showCertifiedOnly,
    showCustomOnly,
    sortField,
    sortDirection
  ]);

  // Counts
  const totalCount = stratigraphies.length;
  const certifiedCount = stratigraphies.filter(s => s.is_certified).length;
  const customCount = stratigraphies.filter(s => !s.is_certified).length;

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Use the real price update hook for general stratigraphies
  const { updateGeneralStratigraphyPrices, isUpdatingGeneralPrices } = useUpdateGeneralStratigraphyPrices();

  return {
    stratigraphies,
    isLoading,
    error,
    totalCount,
    certifiedCount,
    customCount,
    searchTerm,
    setSearchTerm,
    materialSearchTerm,
    setMaterialSearchTerm,
    fireResistance,
    setFireResistance,
    acousticReduction,
    setAcousticReduction,
    supplierName,
    setSupplierName,
    thicknessRange,
    setThicknessRange,
    showCertifiedOnly,
    setShowCertifiedOnly,
    showCustomOnly,
    setShowCustomOnly,
    sortField,
    sortDirection,
    handleSortChange,
    updateGeneralStratigraphyPrices,
    isUpdatingGeneralPrices
  };
};

// Export the type for other components
export type { UnifiedStratigraphy } from './types';
