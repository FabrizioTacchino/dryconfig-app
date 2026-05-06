import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Estimate } from '@/types';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
interface EstimateStratiSummaryCardsProps {
  estimate: Estimate;
  stratigraphies: (EstimateStratigraphy & {
    stratigraphy?: any;
    quantity?: number;
  })[];
  totalCost: number;
}
const EstimateStratiSummaryCards = ({
  estimate,
  stratigraphies,
  totalCost
}: EstimateStratiSummaryCardsProps) => {
  // Defensive: area e quantity Normalization (già dalla query hook, ma mettiamo fallback qui)
  const totalArea = stratigraphies.reduce((sum, item) => {
    const area = typeof item.area === "number" && !isNaN(item.area) ? item.area : 0;
    // some api don't provide quantity, so fallback 1
    const quantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
    return sum + area * quantity;
  }, 0);
  const averageCostPerSqm = totalArea > 0 ? totalCost / totalArea : 0;

  // Debug: si logga warning se ci sono NaN
  React.useEffect(() => {
    const invalids = stratigraphies.filter(s => isNaN(Number(s.area)) || s.quantity !== undefined && isNaN(Number(s.quantity)));
    if (invalids.length > 0) {
      console.warn('[EstimateStratiSummaryCards] stratigrafie con valori area/quantity non validi:', invalids);
    }
  }, [stratigraphies]);
  return <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Numero Stratigrafie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stratigraphies.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Superficie Totale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalArea.toFixed(2)} m²
          </div>
        </CardContent>
      </Card>
      
      
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Costo Medio per m²
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            € {averageCostPerSqm.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default EstimateStratiSummaryCards;