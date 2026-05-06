
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimates } from '@/hooks/useEstimates';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EstimateCard from './EstimateCard';
import CreateEstimateDialog from './CreateEstimateDialog';
import { Estimate } from '@/types';

interface EstimatesListProps {
  projectId: string;
}

const EstimatesList = ({ projectId }: EstimatesListProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  
  const { 
    estimates, 
    isLoading, 
    createEstimate, 
    deleteEstimate, 
    updateEstimateStatus,
    isCreating, 
    isDeleting,
    isUpdatingStatus
  } = useEstimates(projectId);

  const handleCreateEstimate = (data: { name: string; description?: string }) => {
    console.log('EstimatesList handleCreateEstimate called with:', data);
    createEstimate({
      ...data,
      projectId,
    });
    setShowCreateDialog(false);
  };

  const handleStatusChange = (estimateId: string, status: Estimate['status']) => {
    console.log('EstimatesList handleStatusChange called with:', { estimateId, status });
    updateEstimateStatus(estimateId, status);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Caricamento preventivi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Preventivi</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Preventivo
        </Button>
      </div>

      {estimates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nessun preventivo trovato per questo progetto.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crea il primo preventivo
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {estimates.map((estimate) => (
            <EstimateCard
              key={estimate.id}
              estimate={estimate}
              onDelete={deleteEstimate}
              onConfigure={(id) => {
                navigate(`/configurator?estimateId=${id}`);
              }}
              onManage={(id) => {
                navigate(`/estimates/${id}/manage`);
              }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <CreateEstimateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateEstimate={handleCreateEstimate}
        isCreating={isCreating}
      />
    </div>
  );
};

export default EstimatesList;
