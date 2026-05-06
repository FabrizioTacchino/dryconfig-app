
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, AlertCircle } from 'lucide-react';
import MaterialsSummaryTable from './MaterialsSummaryTable';
import { useMaterialsSummary } from '@/hooks/useMaterialsSummary';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

interface MaterialsSummaryCardProps {
  stratigraphies: (EstimateStratigraphy & {
    stratigraphy?: any;
  })[];
  estimateName?: string;
  estimate?: any;
}

const MaterialsSummaryCard = ({
  stratigraphies,
  estimateName,
  estimate
}: MaterialsSummaryCardProps) => {
  const {
    materialsSummary,
    totalCost,
    totalLaborCost,
    totalByCategory,
    isEmpty
  } = useMaterialsSummary(stratigraphies);

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Riepilogo Materiali da Acquistare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-4">
              <Package className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">Nessun materiale da acquistare</p>
                <p className="text-sm">Aggiungi stratigrafie al preventivo per vedere i materiali necessari</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEstimate = totalCost + totalLaborCost;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Riepilogo Materiali da Acquistare
            <Badge variant="secondary" className="ml-2">
              {materialsSummary.length} materiali
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Lista aggregata di tutti i materiali necessari per la realizzazione del preventivo
        </p>
      </CardHeader>
      <CardContent>
        <MaterialsSummaryTable 
          materials={materialsSummary} 
          totalCost={totalCost} 
          totalLaborCost={totalLaborCost} 
          totalByCategory={totalByCategory}
          estimateName={estimateName}
          estimate={estimate}
          stratigraphies={stratigraphies}
        />
      </CardContent>
    </Card>
  );
};

export default MaterialsSummaryCard;
