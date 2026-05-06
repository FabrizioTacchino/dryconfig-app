
import { UnifiedStratigraphy } from './types';
import { WallType } from '@/types';

interface FilterOptions {
  wallType: WallType | 'all';
  searchTerm: string;
  materialSearchTerm: string;
  fireResistance: string;
  acousticReduction: string;
  supplierName: string;
  thicknessRange: string;
  showCertifiedOnly: boolean;
  showCustomOnly: boolean;
}

export const filterStratigraphies = (
  stratigraphies: UnifiedStratigraphy[],
  filters: FilterOptions
): UnifiedStratigraphy[] => {
  return stratigraphies.filter(stratigraphy => {
    // Wall type filter
    if (filters.wallType !== 'all' && stratigraphy.type !== filters.wallType) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm && !stratigraphy.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }

    // Material search filter
    if (filters.materialSearchTerm) {
      const hasMatchingMaterial = stratigraphy.layers?.some(layer => 
        layer.material?.name?.toLowerCase().includes(filters.materialSearchTerm.toLowerCase())
      );
      if (!hasMatchingMaterial) return false;
    }

    // Fire resistance filter
    if (filters.fireResistance && stratigraphy.fire_resistance_class !== filters.fireResistance) {
      return false;
    }

    // Acoustic reduction filter
    if (filters.acousticReduction) {
      const minAcoustic = parseInt(filters.acousticReduction);
      if (!stratigraphy.acoustic_performance || stratigraphy.acoustic_performance < minAcoustic) {
        return false;
      }
    }

    // Supplier filter
    if (filters.supplierName && stratigraphy.supplier_name !== filters.supplierName) {
      return false;
    }

    // Thickness range filter
    if (filters.thicknessRange) {
      const [min, max] = filters.thicknessRange.split('-').map(Number);
      if (stratigraphy.total_thickness < min || (max && stratigraphy.total_thickness > max)) {
        return false;
      }
    }

    // Certified only filter
    if (filters.showCertifiedOnly && !stratigraphy.is_certified) {
      return false;
    }

    // Custom only filter
    if (filters.showCustomOnly && stratigraphy.is_certified) {
      return false;
    }

    return true;
  });
};
