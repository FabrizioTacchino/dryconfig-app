import { toast } from 'sonner';
import { useEstimateStratigraphiesQuery } from './useEstimateStratigraphiesQuery';
import { useCreateEstimateStratigraphy } from './useCreateEstimateStratigraphy';
import { useUpdateEstimateStratigraphy } from './useUpdateEstimateStratigraphy';
import { useDeleteEstimateStratigraphy } from './useDeleteEstimateStratigraphy';
import {
  useBulkUpdateEstimateStratigraphyPrices,
  bulkUpdateSkipReasonLabel,
} from './useBulkUpdateEstimateStratigraphyPrices';

export type { EstimateStratigraphy, CreateEstimateStratigraphyData } from '@/types/estimateStratigraphy';

export const useEstimateStratigraphies = (estimateId?: string) => {
  const { estimateStratigraphies, isLoading, error, totalCost } = useEstimateStratigraphiesQuery(estimateId);
  const { createEstimateStratigraphy, isCreating } = useCreateEstimateStratigraphy();
  const { updateEstimateStratigraphy, isUpdating } = useUpdateEstimateStratigraphy(estimateStratigraphies);
  const { deleteEstimateStratigraphy, isDeleting } = useDeleteEstimateStratigraphy();
  const { bulkUpdatePricesAsync, isBulkUpdating } = useBulkUpdateEstimateStratigraphyPrices();

  /**
   * Aggiornamento prezzi single-row. Riusa la pipeline bulk (1 item batch)
   * così la formula è identica e niente codice duplicato. Estrae il
   * risultato della singola riga per dare un toast specifico (success
   * con delta prezzo, skip con motivo, fail con errore) invece del
   * toast riassuntivo generico del bulk.
   */
  const updateStratigraphyPrices = async (estimateStratigraphyId: string, _originalStratigraphyId: string) => {
    const target = estimateStratigraphies.find(s => s.id === estimateStratigraphyId);
    if (!target || !target.isSnapshot || !target.originalStratigraphyId) {
      toast.error('Impossibile aggiornare: stratigrafia non snapshot o senza riferimento al catalogo');
      return;
    }
    try {
      const report = await bulkUpdatePricesAsync({ estimateStratigraphies: [target], silentToast: true });
      const ok = report.updated[0];
      const skipped = report.skipped[0];
      const failed = report.failed[0];
      if (ok) {
        if (ok.changed) {
          toast.success(`"${ok.name}" aggiornata: €${ok.oldCost.toFixed(2)} → €${ok.newCost.toFixed(2)}/m²`);
        } else {
          toast.info(`"${ok.name}" verificata: prezzo già aggiornato`);
        }
      } else if (skipped) {
        toast.warning(`"${skipped.name}" non aggiornata: ${bulkUpdateSkipReasonLabel(skipped.reason)}`);
      } else if (failed) {
        toast.error(`"${failed.name}": ${failed.error}`);
      }
    } catch (err) {
      // Toast errore già mostrato dall'onError del mutation.
      console.error('[updateStratigraphyPrices] failed:', err);
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
