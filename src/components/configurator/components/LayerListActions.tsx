
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayerListActionsProps {
  onAddLayer: () => void;
  buttonText?: string;
}

const LayerListActions = ({ 
  onAddLayer, 
  buttonText = "Aggiungi Layer" 
}: LayerListActionsProps) => {
  return (
    <div className="flex justify-center pt-4 mt-4 border-t border-gray-200">
      <Button onClick={onAddLayer} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-1" />
        {buttonText}
      </Button>
    </div>
  );
};

export default LayerListActions;
