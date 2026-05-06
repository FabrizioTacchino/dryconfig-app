
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types';

export interface Layer {
  id: string;
  materialId: string;
  material?: DatabaseMaterial;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number; // Solo per strutture
  calculatedCostPerSqm?: number; // New field for dynamic cost calculation
  // NEW: Integrated screw fields
  screwMaterialId?: string; // ID del materiale della vite
  screwMaterial?: DatabaseMaterial; // Dati completi del materiale vite
  screwQuantity?: number; // Quantità viti per m²
  screwCostPerSqm?: number; // Costo delle viti per m²
}

export interface StratigraphyFormData {
  name: string;
  type: string;
  description?: string;
  total_thickness: number;
  weight_per_sqm: number;
  cost_per_sqm: number;
  layers: Array<{
    material_id: string;
    thickness: number;
    position: number;
    inter_axis?: number;
    calculated_cost_per_sqm?: number;
    // NEW: Integrated screw fields for database
    screw_material_id?: string;
    screw_quantity?: number;
    screw_cost_per_sqm?: number;
  }>;
}

export interface StratigraphyPreviewProps {
  layers: Layer[];
  totalThickness: number;
  className?: string;
}

export interface MaterialLegendProps {
  layers: Layer[];
}

export interface StratigraphySVGProps {
  layers: Layer[];
  actualTotalThickness: number;
}
