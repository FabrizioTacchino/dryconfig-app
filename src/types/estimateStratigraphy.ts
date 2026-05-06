
export interface EstimateStratigraphy {
  id: string;
  estimateId: string;
  stratigraphyId: string;
  name: string;
  description?: string;
  area: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  // New fields for independent snapshots
  stratigraphyData?: any;
  layersData?: any;
  pricesUpdatedAt?: Date;
  isSnapshot?: boolean;
  originalStratigraphyId?: string;
  wallHeight?: number; // Added wallHeight property
}

export interface CreateEstimateStratigraphyData {
  estimateId: string;
  stratigraphyId: string;
  name: string;
  description?: string;
  area: number;
  quantity?: number;
  unitCost: number;
  totalCost: number;
  finishLevel?: string;
  wallHeight?: number;
  calculatedMaterials?: any;
}
