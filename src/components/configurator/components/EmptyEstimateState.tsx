
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';

interface EmptyEstimateStateProps {
  estimateId: string;
}

const EmptyEstimateState = ({ estimateId }: EmptyEstimateStateProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nessuna stratigrafia aggiunta</h3>
        <p className="text-muted-foreground mb-4">
          Per aggiungere stratigrafie al preventivo, utilizza il menu azioni (⋮) nelle stratigrafie disponibili.
        </p>
        <Button 
          onClick={() => navigate(`/configurator?estimate=${estimateId}`)}
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Stratigrafie
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyEstimateState;
