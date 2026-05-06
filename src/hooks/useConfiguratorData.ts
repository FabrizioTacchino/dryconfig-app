
import { useSearchParams } from 'react-router-dom';
import { useEstimate } from '@/hooks/useEstimate';
import { useEstimateStratigraphies } from '@/hooks/useEstimateStratigraphies';
import { useStratigraphy } from '@/hooks/useStratigraphy';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

// Tipo specifico per la modifica standalone
interface StandaloneEditingStratigraphy {
  id: string;
  stratigraphyId: string;
  name: string;
  area: number;
  quantity: number;
  stratigraphy: any;
}

export const useConfiguratorData = () => {
  const [searchParams] = useSearchParams();
  
  const estimateId = searchParams.get('estimate');
  const projectId = searchParams.get('project');
  const editStratigraphyId = searchParams.get('editStratigraphy');
  const editCertifiedStratigraphyId = searchParams.get('editCertifiedStratigraphy'); // 🔥 NEW PARAMETER
  const stratigraphyId = searchParams.get('stratigraphyId');
  const viewOnly = searchParams.get('viewOnly') === 'true';

  const { estimate, isLoading: isLoadingEstimate } = useEstimate(estimateId || '');
  const { estimateStratigraphies } = useEstimateStratigraphies(estimateId || undefined);
  
  // Recupera la stratigrafia da database se necessario (per la modifica standalone)
  const { data: standaloneStratigraphy, isLoading: isLoadingStratigraphy, error: stratigraphyError } = useStratigraphy(editStratigraphyId);
  
  // 🔥 NEW: Recupera la stratigrafia CERTIFICATA per modifica
  const { data: certifiedStratigraphy, isLoading: isLoadingCertifiedStratigraphy } = useStratigraphy(editCertifiedStratigraphyId);
  
  // Recupera la stratigrafia per la visualizzazione in sola lettura
  const { data: viewStratigraphy, isLoading: isLoadingViewStratigraphy } = useStratigraphy(stratigraphyId && viewOnly ? stratigraphyId : undefined);

  console.log('[useConfiguratorData] Parameters:', {
    editStratigraphyId,
    editCertifiedStratigraphyId,
    stratigraphyId,
    viewOnly
  });

  // Trova la stratigrafia da modificare o da visualizzare
  let editingStratigraphy: (EstimateStratigraphy & { stratigraphy?: any }) | StandaloneEditingStratigraphy | null = null;
  
  if (editStratigraphyId && !viewOnly) {
    // PERSONALIZED STRATIGRAPHY EDIT
    console.log('[useConfiguratorData] Processing PERSONALIZED stratigraphy edit');
    const estimateStratigraphy = estimateStratigraphies.find(s => s.id === editStratigraphyId);
    
    if (estimateStratigraphy) {
      editingStratigraphy = estimateStratigraphy;
    } else if (standaloneStratigraphy) {
      editingStratigraphy = {
        id: standaloneStratigraphy.id,
        stratigraphyId: standaloneStratigraphy.id,
        name: standaloneStratigraphy.name,
        area: 1,
        quantity: 1,
        stratigraphy: standaloneStratigraphy
      };
    }
  } else if (editCertifiedStratigraphyId && !viewOnly) {
    // 🔥 CERTIFIED STRATIGRAPHY EDIT
    console.log('[useConfiguratorData] Processing CERTIFIED stratigraphy edit:', editCertifiedStratigraphyId);
    if (certifiedStratigraphy) {
      editingStratigraphy = {
        id: certifiedStratigraphy.id,
        stratigraphyId: certifiedStratigraphy.id,
        name: certifiedStratigraphy.name,
        area: 1,
        quantity: 1,
        stratigraphy: certifiedStratigraphy
      };
      console.log('[useConfiguratorData] Certified stratigraphy loaded for edit:', {
        id: certifiedStratigraphy.id,
        name: certifiedStratigraphy.name,
        is_certified: certifiedStratigraphy.is_certified
      });
    }
  } else if (stratigraphyId && viewOnly && viewStratigraphy) {
    // Modalità di sola visualizzazione
    editingStratigraphy = {
      id: viewStratigraphy.id,
      stratigraphyId: viewStratigraphy.id,
      name: viewStratigraphy.name,
      area: 1,
      quantity: 1,
      stratigraphy: viewStratigraphy
    };
  }

  if (!editingStratigraphy && (editStratigraphyId || editCertifiedStratigraphyId)) {
    console.warn('[useConfiguratorData] Stratigrafia NON trovata per edit:', {
      editStratigraphyId,
      editCertifiedStratigraphyId,
      standaloneStratigraphy: !!standaloneStratigraphy,
      certifiedStratigraphy: !!certifiedStratigraphy
    });
  }

  return {
    estimateId,
    projectId,
    editStratigraphyId,
    editCertifiedStratigraphyId, // 🔥 EXPOSE NEW PARAMETER
    stratigraphyId,
    viewOnly,
    estimate,
    isLoadingEstimate,
    isLoadingStratigraphy: isLoadingStratigraphy || isLoadingViewStratigraphy || isLoadingCertifiedStratigraphy,
    stratigraphyError,
    editingStratigraphy,
    standaloneStratigraphy,
    certifiedStratigraphy, // 🔥 EXPOSE CERTIFIED STRATIGRAPHY
    viewStratigraphy
  };
};
