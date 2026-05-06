import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WallType, DatabaseWallType } from '@/types';
import { toast } from 'sonner';
import { Layer } from '../components/configurator/types/StratigraphyTypes';

// Helper function to convert WallType to DatabaseWallType
const mapWallTypeToDatabase = (wallType: WallType): DatabaseWallType => {
  if (['plating', 'counterwall', 'single', 'double', 'ceiling'].includes(wallType)) {
    return wallType as DatabaseWallType;
  }
  
  switch (wallType) {
    case 'internal':
    case 'external':
      return 'single';
    case 'roof':
      return 'ceiling';
    case 'foundation':
      return 'single';
    default:
      return 'single';
  }
};

interface SaveStratigraphyData {
  id?: string;
  name: string;
  description: string;
  type: WallType;
  layers: Layer[];
  totalThickness: number;
  estimatedCost: number;
  weightPerSqm: number;
}

// This hook is deprecated - using useIntegratedStratigraphySave instead
// Keeping only as a stub to prevent build errors

export const useBoardWithScrewsSave = () => {
  console.warn('[useBoardWithScrewsSave] DEPRECATED: Use useIntegratedStratigraphySave instead');
  
  return {
    mutate: () => {},
    isPending: false
  };
};
