
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Estimate } from '@/types';
import { EstimateWall } from '@/types/estimate';

interface EstimateSummaryCardsProps {
  estimate: Estimate;
  walls: EstimateWall[];
  totalCost: number;
}

const EstimateSummaryCards = ({ estimate, walls, totalCost }: EstimateSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Numero Pareti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{walls.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Totale Calcolato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            € {totalCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Totale Preventivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            € {estimate.totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimateSummaryCards;
