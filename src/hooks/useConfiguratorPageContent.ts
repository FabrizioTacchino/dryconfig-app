
import { useNavigate } from 'react-router-dom';

interface UseConfiguratorPageContentProps {
  estimateId: string | null;
  projectId: string | null;
  editingStratigraphy: any;
  estimate: any;
  standaloneStratigraphy: any;
}

export const useConfiguratorPageContent = ({
  estimateId,
  projectId,
  editingStratigraphy,
  estimate,
  standaloneStratigraphy
}: UseConfiguratorPageContentProps) => {
  const navigate = useNavigate();

  const handleBackNavigation = () => {
    if (estimateId) {
      navigate(`/estimates/${estimateId}`);
    } else if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Determina il contesto della pagina
  const isStandalone = !estimateId && !projectId;
  const isEditingMode = !!editingStratigraphy;

  const getPageTitle = () => {
    if (isEditingMode) return 'Modifica Stratigrafia';
    if (isStandalone) return 'Configuratore Stratigrafie';
    return 'Configuratore';
  };

  const getPageDescription = () => {
    if (isEditingMode && estimateId && estimate) {
      return `Modifica la stratigrafia "${editingStratigraphy.name}" per il preventivo "${estimate.name}"`;
    }
    if (isEditingMode && isStandalone && standaloneStratigraphy) {
      return `Modifica la stratigrafia "${standaloneStratigraphy.name}"`;
    }
    if (estimateId && estimate) {
      return `Configura stratigrafie per il preventivo "${estimate.name}"`;
    }
    if (isStandalone) {
      return 'Seleziona, crea e gestisci stratigrafie per pareti certificate - Usa il menu con i tre puntini per modificare, duplicare, eliminare o assegnare le stratigrafie a un preventivo.';
    }
    return 'Configura stratigrafie e pareti certificate';
  };

  const getBackButtonText = () => {
    if (estimateId) return 'Torna al Preventivo';
    if (projectId) return 'Torna al Progetto';
    return 'Torna alla Dashboard';
  };

  return {
    handleBackNavigation,
    getPageTitle,
    getPageDescription,
    getBackButtonText
  };
};
