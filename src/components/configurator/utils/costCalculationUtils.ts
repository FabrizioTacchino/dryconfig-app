
import { DatabaseMaterial } from '@/hooks/useMaterials';

export const calculateLayerCostPerSqm = (
  material: DatabaseMaterial,
  interAxis?: number
): number => {
  if (!material) return 0;

  console.log(`costCalculationUtils - Calculating cost for ${material.name} (category: ${material.category})`);
  
  let materialCost = 0;
  
  if (material.category === 'structure_frame') {
    // Per i montanti: calcola incidenza basata su interAxis
    const interAxisValue = interAxis || 600; // Default 600mm
    const incidenceBase = material.incidence_base || material.incidence_per_sqm || 1;
    const calculatedIncidence = incidenceBase * (600 / interAxisValue);
    materialCost = calculatedIncidence * material.unit_price;
    console.log(`costCalculationUtils - Structure Frame ${material.name}: incidenceBase=${incidenceBase}, interAxis=${interAxisValue}, calculatedIncidence=${calculatedIncidence}, unit_price=${material.unit_price}, materialCost=${materialCost}`);
  } else if (material.category === 'structure_guide') {
    // Per le guide: usa solo incidenza per metro quadro
    const incidence = material.incidence_per_sqm || 1;
    materialCost = incidence * material.unit_price;
    console.log(`costCalculationUtils - Structure Guide ${material.name}: incidence=${incidence}, unit_price=${material.unit_price}, materialCost=${materialCost}`);
  } else if (material.category === 'board') {
    // Per le lastre: usa incidenza per metro quadro (già include il calcolo dello spessore se necessario)
    const incidence = material.incidence_per_sqm || 1;
    materialCost = incidence * material.unit_price;
    console.log(`costCalculationUtils - Board ${material.name}: incidence=${incidence}, unit_price=${material.unit_price}, materialCost=${materialCost}`);
  } else {
    // Per altri materiali: usa incidenza per metro quadro
    const incidence = material.incidence_per_sqm || 1;
    materialCost = incidence * material.unit_price;
    console.log(`costCalculationUtils - Other ${material.name}: incidence=${incidence}, unit_price=${material.unit_price}, materialCost=${materialCost}`);
  }
  
  console.log(`costCalculationUtils - Final cost for ${material.name}: ${materialCost}`);
  return materialCost;
};
