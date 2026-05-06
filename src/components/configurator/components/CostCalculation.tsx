
import React from 'react';

interface CostCalculationProps {
  wallArea: number;
  quantity: number;
  unitCost: number;
}

const CostCalculation = ({ wallArea, quantity, unitCost }: CostCalculationProps) => {
  const totalCost = wallArea * quantity * unitCost;

  return (
    <div className="rounded-lg border">
      <div className="p-3 bg-muted/50 border-b">
        <h3 className="font-medium">Calcolo costi</h3>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between">
          <span>Superficie:</span>
          <span>{wallArea} mq</span>
        </div>
        <div className="flex justify-between">
          <span>Quantità:</span>
          <span>{quantity}</span>
        </div>
        <div className="flex justify-between">
          <span>Costo unitario:</span>
          <span>€ {unitCost.toFixed(2)}/mq</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-medium">
          <span>Totale:</span>
          <span>€ {totalCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CostCalculation;
