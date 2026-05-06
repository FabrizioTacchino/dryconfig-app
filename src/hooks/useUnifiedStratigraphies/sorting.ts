
import { UnifiedStratigraphy, SortField, SortDirection } from './types';

export const sortStratigraphies = (
  stratigraphies: UnifiedStratigraphy[],
  sortField: SortField,
  sortDirection: SortDirection
): UnifiedStratigraphy[] => {
  return [...stratigraphies].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = sortDirection === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
    if (bValue === null || bValue === undefined) bValue = sortDirection === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;

    // Convert to string for text fields
    if (sortField === 'name' || sortField === 'fire_resistance_class' || sortField === 'supplier_name') {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
};

export const applySorting = sortStratigraphies;
