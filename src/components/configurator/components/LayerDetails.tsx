
import React from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { Badge } from '@/components/ui/badge';
import { hasVariableThickness } from '../utils/materialUtils';
import { calculateLayerCostPerSqm } from '../utils/costCalculationUtils';

interface LayerDetailsProps {
  material?: DatabaseMaterial;
  passo?: number; // For structure frame materials
  calculatedCost?: number; // Pre-calculated cost per sqm
  finishLevel?: string; // For applying finish level multipliers
  finishLevels?: { finish_level: string; cost_multiplier: number; time_multiplier: number }[]; // Available finish levels
}

const LayerDetails = ({ material, passo, calculatedCost, finishLevel, finishLevels }: LayerDetailsProps) => {
  if (!material) return null;

  // Helper function to determine if material is stucco/plaster that should be multiplied
  const isPlasterMaterial = (material: DatabaseMaterial) => {
    const isPlaster = material.category === 'accessory' && 
           (material.name.toLowerCase().includes('stucco') || 
            material.name.toLowerCase().includes('rasare') ||
            material.name.toLowerCase().includes('plaster'));
    
    console.log(`[LayerDetails] 🎨 PLASTER CHECK: ${material.name} - category: ${material.category}, isPlaster: ${isPlaster}`);
    return isPlaster;
  };

  const calculateCostPerSqm = () => {
    let baseCost: number;

    // Always use pre-calculated cost if available, otherwise calculate
    if (calculatedCost !== undefined) {
      console.log(`LayerDetails - Using pre-calculated cost for ${material.name}: ${calculatedCost}`);
      baseCost = calculatedCost;
    } else {
      // Fallback to dynamic calculation
      baseCost = calculateLayerCostPerSqm(material, passo);
      console.log(`LayerDetails - Calculated cost for ${material.name}: ${baseCost}`);
    }

    // 🔥 ALWAYS Apply finish level multiplier to plaster materials (even with pre-calculated cost)
    console.log(`[LayerDetails] 🎨 FINISH MULTIPLIER CHECK:`, {
      materialName: material.name,
      isPlasterMaterial: isPlasterMaterial(material),
      finishLevel: finishLevel,
      hasFinishLevels: !!finishLevels,
      finishLevelsCount: finishLevels?.length || 0,
      baseCost: baseCost.toFixed(3)
    });
    
    if (isPlasterMaterial(material) && finishLevel && finishLevels) {
      const finishLevelData = finishLevels.find(level => level.finish_level === finishLevel);
      const multiplier = finishLevelData?.cost_multiplier || 1;
      
      console.log(`[LayerDetails] 🎨 APPLYING MULTIPLIER:`, {
        finishLevel,
        finishLevelData,
        multiplier,
        baseCost: baseCost.toFixed(3)
      });
      
      // 🔥 Apply multiplier even if it's 1 (for logging purposes)
      const adjustedCost = baseCost * multiplier;
      console.log(`[LayerDetails] ✅ COST ${multiplier !== 1 ? 'MULTIPLIED' : 'UNCHANGED'}: ${material.name} ${baseCost.toFixed(3)} → ${adjustedCost.toFixed(3)} (x${multiplier})`);
      return adjustedCost.toFixed(2);
    }

    console.log(`[LayerDetails] ➡️ NO MULTIPLIER APPLIED: ${material.name} = ${baseCost.toFixed(3)}`);
    return baseCost.toFixed(2);
  };

  const getIncidenceDisplay = () => {
    if (material.category === 'structure_frame' && passo) {
      const incidenceBase = material.incidence_base || 1;
      const calculatedIncidence = incidenceBase * (600 / passo);
      return `${calculatedIncidence.toFixed(2)} ml/m² (passo ${passo}mm)`;
    }
    return `${(material.incidence_per_sqm || 1).toFixed(2)} ${material.unit}/m²`;
  };

  return (
    <div className="mt-2 p-3 bg-gray-50 border rounded-lg text-xs">
      {/* Informazioni principali compatte - layout a 3 colonne */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 mb-2">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Codice:</span>
          <Badge variant="outline" className="text-xs px-1 py-0">
            {material.code}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Prezzo:</span>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 px-1 py-0">
            €{(material.unit_price || 0).toFixed(2)}/{material.unit || 'mq'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Incidenza:</span>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 px-1 py-0">
            {getIncidenceDisplay()}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Costo m²:</span>
          <Badge variant="outline" className="text-xs bg-construction-light text-construction-primary font-medium px-1 py-0">
            €{calculateCostPerSqm()}/m²
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Peso:</span>
          <Badge variant="outline" className="text-xs px-1 py-0">
            {(material.weight_per_sqm || 0).toFixed(2)} kg/mq
          </Badge>
        </div>
        {!hasVariableThickness(material) && material.thickness && (
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Spessore:</span>
            <Badge variant="outline" className="text-xs text-blue-600 px-1 py-0">
              {material.thickness}mm
            </Badge>
          </div>
        )}
      </div>

      {/* Fornitore - riga separata */}
      <div className="mb-2 pb-2 border-b border-gray-200">
        <span className="text-gray-600">Fornitore:</span>
        <span className="ml-1 font-medium">{material.supplier}</span>
      </div>

      {/* Proprietà aggiuntive se presenti */}
      {material.thermal_conductivity && (
        <div className="mb-2">
          <span className="text-gray-600">λ:</span>
          <span className="ml-1">{material.thermal_conductivity} W/mK</span>
        </div>
      )}

      {/* Technical properties */}
      {material.fire_resistance_class && (
        <div className="mb-2">
          <span className="text-gray-600">Classe fuoco:</span>
          <Badge variant="outline" className="ml-1 text-xs">
            {material.fire_resistance_class}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default LayerDetails;
