
import { useEstimateStratigraphiesQuery } from './useEstimateStratigraphiesQuery';
import { useCreateEstimateStratigraphy } from './useCreateEstimateStratigraphy';
import { useUpdateEstimateStratigraphy } from './useUpdateEstimateStratigraphy';
import { useDeleteEstimateStratigraphy } from './useDeleteEstimateStratigraphy';
import { useBulkUpdateEstimateStratigraphyPrices } from './useBulkUpdateEstimateStratigraphyPrices';

export type { EstimateStratigraphy, CreateEstimateStratigraphyData } from '@/types/estimateStratigraphy';

export const useEstimateStratigraphies = (estimateId?: string) => {
  const { estimateStratigraphies, isLoading, error, totalCost } = useEstimateStratigraphiesQuery(estimateId);
  const { createEstimateStratigraphy, isCreating } = useCreateEstimateStratigraphy();
  const { updateEstimateStratigraphy, isUpdating } = useUpdateEstimateStratigraphy(estimateStratigraphies);
  const { deleteEstimateStratigraphy, isDeleting } = useDeleteEstimateStratigraphy();
  const { bulkUpdatePrices, isBulkUpdating } = useBulkUpdateEstimateStratigraphyPrices();

  // Wrapper function to handle single stratigraphy updates using the bulk update
  const updateStratigraphyPrices = (estimateStratigraphyId: string, originalStratigraphyId: string) => {
    const targetStratigraphy = estimateStratigraphies.find(s => s.id === estimateStratigraphyId);
    if (targetStratigraphy && targetStratigraphy.isSnapshot && targetStratigraphy.originalStratigraphyId) {
      console.log('[useEstimateStratigraphies] 🎯 Aggiornamento singola stratigrafia snapshot:', {
        id: targetStratigraphy.id,
        name: targetStratigraphy.name,
        originalId: targetStratigraphy.originalStratigraphyId
      });
      bulkUpdatePrices({ estimateStratigraphies: [targetStratigraphy] });
    } else {
      console.warn('[useEstimateStratigraphies] ❌ Impossibile aggiornare:', {
        found: !!targetStratigraphy,
        isSnapshot: targetStratigraphy?.isSnapshot,
        hasOriginalId: !!targetStratigraphy?.originalStratigraphyId,
        targetId: estimateStratigraphyId
      });
    }
  };

  return {
    estimateStratigraphies,
    isLoading,
    error,
    totalCost,
    createEstimateStratigraphy,
    updateEstimateStratigraphy,
    deleteEstimateStratigraphy,
    updateStratigraphyPrices,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingPrices: isBulkUpdating,
  };
};
