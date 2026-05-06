
import React, { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import WallConfigurator from '@/components/configurator/WallConfigurator';
import EstimateInfoCard from '@/components/configurator/EstimateInfoCard';
import ConfiguratorHeader from '@/components/configurator/components/ConfiguratorHeader';
import ConfiguratorLoadingState from '@/components/configurator/components/ConfiguratorLoadingState';
import ConfiguratorErrorState from '@/components/configurator/components/ConfiguratorErrorState';
import { useConfiguratorData } from '@/hooks/useConfiguratorData';
import { useConfiguratorPageContent } from '@/hooks/useConfiguratorPageContent';

const Configurator = () => {
  const {
    estimateId,
    projectId,
    editStratigraphyId,
    stratigraphyId,
    viewOnly,
    estimate,
    isLoadingEstimate,
    isLoadingStratigraphy,
    editingStratigraphy,
    standaloneStratigraphy
  } = useConfiguratorData();

  const {
    handleBackNavigation,
    getPageTitle,
    getPageDescription,
    getBackButtonText
  } = useConfiguratorPageContent({
    estimateId,
    projectId,
    editingStratigraphy,
    estimate,
    standaloneStratigraphy
  });

  // Debug logs
  useEffect(() => {
    console.log('Configurator params:', {
      estimateId,
      projectId,
      editStratigraphyId,
      stratigraphyId,
      viewOnly
    });
  }, [estimateId, projectId, editStratigraphyId, stratigraphyId, viewOnly]);

  // Debug log per la stratigrafia in modifica o visualizzazione
  useEffect(() => {
    if (editStratigraphyId || (stratigraphyId && viewOnly)) {
      console.log('Looking for stratigraphy:', { editStratigraphyId, stratigraphyId, viewOnly });
      console.log('Final editing stratigraphy:', editingStratigraphy);
    }
  }, [editStratigraphyId, stratigraphyId, viewOnly, editingStratigraphy]);

  // Loading states
  if ((isLoadingEstimate && estimateId) || (isLoadingStratigraphy && (editStratigraphyId || (stratigraphyId && viewOnly)))) {
    const message = isLoadingEstimate ? 'Caricamento preventivo...' : 'Caricamento stratigrafia...';
    return <ConfiguratorLoadingState message={message} />;
  }

  // Error state - stratigraphy not found
  if ((editStratigraphyId || (stratigraphyId && viewOnly)) && !editingStratigraphy && !isLoadingStratigraphy) {
    return <ConfiguratorErrorState editStratigraphyId={editStratigraphyId || stratigraphyId} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">
            <ConfiguratorHeader
              onBackNavigation={handleBackNavigation}
              backButtonText={getBackButtonText()}
              pageTitle={getPageTitle()}
              pageDescription={getPageDescription()}
            />
            
            {estimateId && <EstimateInfoCard estimateId={estimateId} />}
            
            <WallConfigurator 
              estimateId={estimateId} 
              editingStratigraphy={editingStratigraphy}
              initialStratigraphyId={stratigraphyId}
              viewOnly={viewOnly}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Configurator;
