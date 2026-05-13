import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import { useEstimate } from '@/hooks/useEstimate';
import { useEstimateStratigraphies } from '@/hooks/useEstimateStratigraphies';
import EstimateHeader from '@/components/estimates/EstimateHeader';
import EstimateStratiSummaryCards from '@/components/estimates/EstimateStratiSummaryCards';
import EstimateStratigraphiesSection from '@/components/estimates/EstimateStratigraphiesSection';
import MaterialsSummaryCard from '@/components/estimates/MaterialsSummaryCard';
import SellingPriceCard from '@/components/estimates/SellingPriceCard';
import EstimateLoadingState from '@/components/estimates/EstimateLoadingState';
import EstimateErrorState from '@/components/estimates/EstimateErrorState';

const EstimateManagement = () => {
  const { estimateId } = useParams();
  
  const { estimate, isLoading: isLoadingEstimate } = useEstimate(estimateId || '');
  const { 
    estimateStratigraphies, 
    isLoading: isLoadingStratigraphies,
    totalCost,
    createEstimateStratigraphy, 
    updateEstimateStratigraphy, 
    deleteEstimateStratigraphy,
    updateStratigraphyPrices,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingPrices
  } = useEstimateStratigraphies(estimateId);

  if (!estimateId) {
    return <div>ID preventivo non trovato</div>;
  }

  if (isLoadingEstimate || isLoadingStratigraphies) {
    return <EstimateLoadingState />;
  }

  if (!estimate) {
    return <EstimateErrorState />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8 space-y-6">
            <EstimateHeader estimate={estimate} stratigraphies={estimateStratigraphies} />
            
            <EstimateStratiSummaryCards 
              estimate={estimate} 
              stratigraphies={estimateStratigraphies} 
              totalCost={totalCost} 
            />

            <EstimateStratigraphiesSection
              stratigraphies={estimateStratigraphies}
              estimateId={estimateId}
              estimateStatus={estimate.status}
              onUpdateStratigraphy={updateEstimateStratigraphy}
              onDeleteStratigraphy={deleteEstimateStratigraphy}
              onUpdatePrices={updateStratigraphyPrices}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              isUpdatingPrices={isUpdatingPrices}
            />

            <SellingPriceCard stratigraphies={estimateStratigraphies} />

            <MaterialsSummaryCard
              stratigraphies={estimateStratigraphies}
              estimateName={estimate.name}
              estimate={estimate}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default EstimateManagement;
