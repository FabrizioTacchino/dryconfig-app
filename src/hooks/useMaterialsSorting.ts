
import { useState, useCallback } from 'react';
import { DatabaseMaterial } from './useMaterials';

export type MaterialSortField =
  | 'code'
  | 'name'
  | 'category'
  | 'supplier'
  | 'unit_price'
  | 'discount'
  | 'incidence_per_sqm'
  | 'cost_per_sqm';

export type SortDirection = 'asc' | 'desc';

export interface UseMaterialsSortingReturn {
  sortField: MaterialSortField;
  sortDirection: SortDirection;
  setSort: (field: MaterialSortField) => void;
  getSortedMaterials: (materials: DatabaseMaterial[]) => DatabaseMaterial[];
}

// Calcolo di costo/m²
const getCostPerSqm = (material: DatabaseMaterial) => {
  const incidence = material.incidence_per_sqm || 1;
  // Usa calculateFinalPrice per gestire sconti cumulativi
  const { calculateFinalPrice } = require('@/utils/discountUtils');
  const finalPrice = calculateFinalPrice(material.unit_price, material.list_price, material.discount);
  return finalPrice * incidence;
};

export function useMaterialsSorting(
  initialField: MaterialSortField = 'name',
  initialDirection: SortDirection = 'asc'
): UseMaterialsSortingReturn {
  const [sortField, setSortField] = useState<MaterialSortField>(initialField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const setSort = useCallback((field: MaterialSortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  const getSortedMaterials = useCallback(
    (materials: DatabaseMaterial[]) => {
      const sorted = [...materials].sort((a, b) => {
        let av: any, bv: any;

        switch (sortField) {
          case 'code':
          case 'name':
          case 'supplier':
          case 'category':
            av = (a[sortField] || '').toLowerCase();
            bv = (b[sortField] || '').toLowerCase();
            break;
          case 'unit_price':
          case 'discount':
          case 'incidence_per_sqm':
            av = a[sortField] ?? 0;
            bv = b[sortField] ?? 0;
            break;
          case 'cost_per_sqm':
            av = getCostPerSqm(a);
            bv = getCostPerSqm(b);
            break;
          default:
            av = a[sortField];
            bv = b[sortField];
        }

        if (typeof av === 'number' && typeof bv === 'number') {
          return av - bv;
        }
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      });

      if (sortDirection === 'desc') sorted.reverse();
      return sorted;
    },
    [sortField, sortDirection]
  );

  return {
    sortField,
    sortDirection,
    setSort,
    getSortedMaterials,
  };
}
