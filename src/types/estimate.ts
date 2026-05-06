
export interface EstimateWall {
  id: string;
  estimateId: string;
  name: string;
  wallType: 'plating' | 'counterwall' | 'single' | 'double' | 'ceiling';
  stratigraphyId?: string;
  area: number;
  pricePerSqm: number;
  materialCost: number;
  laborCost: number;
  accessoriesCost: number;
  totalCost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEstimateWallData {
  name: string;
  wallType: 'plating' | 'counterwall' | 'single' | 'double' | 'ceiling';
  stratigraphyId?: string;
  area: number;
  pricePerSqm: number;
  materialCost: number;
  laborCost: number;
  accessoriesCost: number;
  notes?: string;
}

export interface UpdateEstimateWallData extends Partial<CreateEstimateWallData> {
  id: string;
}
