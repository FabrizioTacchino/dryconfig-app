
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface EstimateHeaderProps {
  estimateName?: string;
  stratigraphiesCount: number;
  totalCost: number;
}

const EstimateHeader = ({ estimateName, stratigraphiesCount, totalCost }: EstimateHeaderProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Riepilogo Preventivo: {estimateName}
        </CardTitle>
        <CardDescription>
          Stratigrafie aggiunte al preventivo corrente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {stratigraphiesCount} stratigrafie aggiunte
          </div>
          <div className="text-lg font-semibold">
            Totale: € {totalCost.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstimateHeader;
