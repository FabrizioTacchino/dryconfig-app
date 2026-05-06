
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EstimateTotalsProps {
  totalCost: number;
  estimateId: string;
}

const EstimateTotals = ({ totalCost, estimateId }: EstimateTotalsProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Totale Preventivo</h3>
            <p className="text-2xl font-bold">€ {totalCost.toFixed(2)}</p>
          </div>
          <div className="space-x-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/estimates/${estimateId}`)}
            >
              Vai al Preventivo
            </Button>
            <Button
              onClick={() => navigate(`/configurator?estimate=${estimateId}`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Stratigrafie
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstimateTotals;
