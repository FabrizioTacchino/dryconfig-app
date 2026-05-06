
import { useCallback, useEffect, useState } from "react";
import { useConfiguratorSettings } from "./useConfiguratorSettings";

/**
 * Advanced cost calculation 
 * Reads cost_per_hour from settings
 * Calculates: 
 *   - costPerHour (from settings, number)
 *   - getAdvancedEstimate (returns breakdown obj)
 * 
 * Usage:
 * const { isLoading, costPerHour, getAdvancedEstimate } = useAdvancedCostCalculation();
 * // then call getAdvancedEstimate({ layers, selectedFinishLevel, totalArea }) to get breakdown
 */

interface LayerCostInput {
  materialCost: number;
  // estimated install time for this layer in hours; optional
  installTimeHours?: number;
}

interface EstimateBreakdownInput {
  layers: LayerCostInput[];
  finishLevel: string;
  totalArea: number;
}

interface EstimateBreakdownResult {
  materialCost: number;
  laborCost: number;
  finishTimeMultiplier: number;
  finishCostMultiplier: number;
  accessoriesCost: number;
  screwCost: number;
  total: number;
  detail: {
    baseMaterial: number;
    labor: number;
    accessories: number;
    finishLevel: string;
    multipliers: {
      time: number;
      cost: number;
    };
  };
}

export const useAdvancedCostCalculation = () => {
  const { getSetting } = useConfiguratorSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [costPerHour, setCostPerHour] = useState<number>(30); // default fallback

  useEffect(() => {
    let _active = true;
    setIsLoading(true);
    getSetting("cost_per_hour").then((hourStr) => {
      if (!_active) return;
      const parsedCostPerHour = Number(hourStr) || 30;
      console.log('[useAdvancedCostCalculation] 💰 LOADED COST PER HOUR:', {
        hourStr,
        parsedCostPerHour
      });
      setCostPerHour(parsedCostPerHour);
      setIsLoading(false);
    });
    return () => {
      _active = false;
    };
  }, [getSetting]);

  // Main calculation function
  const getAdvancedEstimate = useCallback(
    ({ layers, finishLevel, totalArea }: EstimateBreakdownInput): EstimateBreakdownResult => {
      // Material cost is sum of all layer material costs
      const materialCost = layers.reduce((sum, layer) => sum + (layer.materialCost ?? 0), 0);
      // Labor time is assumed: installTimeHours per layer
      const baseHours = layers.reduce(
        (sum, layer) => sum + (layer.installTimeHours ?? 0), 0
      );
      const laborCost = baseHours * costPerHour;
      // No accessories for now since we removed that functionality
      const accessoriesCost = 0;
      // Total
      const total = materialCost + laborCost + accessoriesCost;

      return {
        materialCost,
        laborCost,
        finishTimeMultiplier: 1,
        finishCostMultiplier: 1,
        accessoriesCost,
        screwCost: 0, // Per ora non calcolato in questa funzione
        total,
        detail: {
          baseMaterial: materialCost,
          labor: laborCost,
          accessories: accessoriesCost,
          finishLevel,
          multipliers: {
            time: 1,
            cost: 1
          },
        },
      };
    },
    [costPerHour]
  );

  return {
    isLoading,
    costPerHour,
    getAdvancedEstimate,
  };
};
