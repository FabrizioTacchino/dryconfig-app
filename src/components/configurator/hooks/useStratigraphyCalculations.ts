
import { useMemo } from 'react';
import { useMaterials } from '@/hooks/useMaterials';

interface UseStratigraphyCalculationsProps {
  layers: any[];
}

export const useStratigraphyCalculations = ({ layers }: UseStratigraphyCalculationsProps) => {
  const calculateCost = useMemo(() => {
    return () => {
      return layers.reduce((sum, layer) => {
        if (layer.material) {
          console.log(`useStratigraphyCalculations - Processing layer: ${layer.material.name} (category: ${layer.material.category})`);
          
          let materialCost = 0;
          
          if (layer.material.category === 'structure_frame') {
            // Per i montanti: calcola incidenza basata su interAxis
            const interAxis = layer.interAxis || 600; // Default 600mm
            const incidenceBase = layer.material.incidence_base || layer.material.incidence_per_sqm || 1;
            const calculatedIncidence = incidenceBase * (600 / interAxis);
            materialCost = calculatedIncidence * layer.material.unit_price;
            console.log(`useStratigraphyCalculations - Structure Frame ${layer.material.name}: incidenceBase=${incidenceBase}, interAxis=${interAxis}, calculatedIncidence=${calculatedIncidence}, unit_price=${layer.material.unit_price}, materialCost=${materialCost}`);
          } else if (layer.material.category === 'structure_guide') {
            // Per le guide: usa solo incidenza per metro quadro
            const incidence = layer.material.incidence_per_sqm || 1;
            materialCost = incidence * layer.material.unit_price;
            console.log(`useStratigraphyCalculations - Structure Guide ${layer.material.name}: incidence=${incidence}, unit_price=${layer.material.unit_price}, materialCost=${materialCost}`);
          } else if (layer.material.category === 'board') {
            // Per le lastre: usa incidenza per metro quadro (già include il calcolo dello spessore se necessario)
            const incidence = layer.material.incidence_per_sqm || 1;
            materialCost = incidence * layer.material.unit_price;
            console.log(`useStratigraphyCalculations - Board ${layer.material.name}: incidence=${incidence}, unit_price=${layer.material.unit_price}, materialCost=${materialCost}`);
          } else {
            // Per altri materiali: usa incidenza per metro quadro
            const incidence = layer.material.incidence_per_sqm || 1;
            materialCost = incidence * layer.material.unit_price;
            console.log(`useStratigraphyCalculations - Other ${layer.material.name}: incidence=${incidence}, unit_price=${layer.material.unit_price}, materialCost=${materialCost}`);
          }
          
          console.log(`useStratigraphyCalculations - Layer ${layer.material.name}: final materialCost = ${materialCost}`);
          
          return sum + materialCost;
        }
        return sum;
      }, 0);
    };
  }, [layers]);

  const calculateWeight = useMemo(() => {
    return () => {
      return layers.reduce((sum, layer) => {
        if (layer.material) {
          const incidence = layer.material.incidence_per_sqm || 1;
          const weight = (layer.material.weight_per_sqm || 0) * incidence;
          return sum + weight;
        }
        return sum;
      }, 0);
    };
  }, [layers]);

  // For integrated system, calculate screws from layer data directly
  const integratedScrewsCost = useMemo(() => {
    return layers.reduce((sum, layer) => {
      return sum + (layer.screwCostPerSqm || 0);
    }, 0);
  }, [layers]);

  const calculateTotalWithScrews = useMemo(() => {
    return () => {
      const matCost = layers.reduce((sum, layer) => {
        if (layer.material) {
          let materialCost = 0;
          if (layer.material.category === 'structure_frame') {
            const interAxis = layer.interAxis || 600;
            const incidenceBase = layer.material.incidence_base || layer.material.incidence_per_sqm || 1;
            const calculatedIncidence = incidenceBase * (600 / interAxis);
            materialCost = calculatedIncidence * layer.material.unit_price;
          } else if (layer.material.category === 'structure_guide') {
            const incidence = layer.material.incidence_per_sqm || 1;
            materialCost = incidence * layer.material.unit_price;
          } else if (layer.material.category === 'board') {
            const incidence = layer.material.incidence_per_sqm || 1;
            materialCost = incidence * layer.material.unit_price;
          } else {
            const incidence = layer.material.incidence_per_sqm || 1;
            materialCost = incidence * layer.material.unit_price;
          }
          return sum + materialCost;
        }
        return sum;
      }, 0);
      return matCost + integratedScrewsCost;
    };
  }, [layers, integratedScrewsCost]);

  return {
    calculateCost,
    calculateWeight,
    calculateTotalWithScrews
  };
};
