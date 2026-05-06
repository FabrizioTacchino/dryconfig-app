
import { WallType } from '@/types';

export interface UnifiedStratigraphy {
  id: string;
  name: string;
  description: string;
  type: WallType;
  is_certified: boolean;
  fire_resistance_class: string | null;
  acoustic_performance: number | null;
  supplier_name?: string;
  certification_id: string | null;
  total_thickness: number;
  weight_per_sqm: number | null;
  thermal_performance: number | null;
  cost_per_sqm: number | null;
  installation_time_per_sqm: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  layers?: any[];
  // 🎯 COSTI COMPRENSIVI CON ACCESSORI SEPARATI
  material_cost_per_sqm?: number;
  screw_cost_per_sqm?: number;
  labor_cost_per_sqm?: number;
  // 🔥 NUOVI CAMPI PER ACCESSORI SEPARATI
  corner_cost_per_sqm?: number;
  tape_cost_per_sqm?: number;
  putty_cost_per_sqm?: number;
  accessories_cost_per_sqm?: number;
  comprehensive_cost_per_sqm?: number;
  // Proprietà di compatibilità in formato camelCase
  materialCostPerSqm?: number;
  screwCostPerSqm?: number;
  laborCostPerSqm?: number;
  // 🔥 CAMELCASE PER ACCESSORI SEPARATI
  cornerCostPerSqm?: number;
  tapeCostPerSqm?: number;
  puttyCostPerSqm?: number;
  accessoriesCostPerSqm?: number;
  comprehensiveCostPerSqm?: number;
  // Store original for reference
  original_cost_per_sqm?: number;
}

export type SortField = 'name' | 'total_thickness' | 'weight_per_sqm' | 'cost_per_sqm' | 'acoustic_performance' | 'fire_resistance_class' | 'supplier_name';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  searchTerm: string;
  materialSearchTerm: string;
  fireResistance: string;
  acousticReduction: string;
  supplierName: string;
  thicknessRange: string;
  showCertifiedOnly: boolean;
  showCustomOnly: boolean;
}

export interface SortState {
  sortField: SortField;
  sortDirection: SortDirection;
}
