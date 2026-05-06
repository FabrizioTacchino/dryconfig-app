
import React, { useState, useEffect } from 'react';
import { StratigraphyPreviewProps } from './types/StratigraphyTypes';
import { calculateActualThickness } from './utils/stratigraphyUtils';
import MaterialLegend from './components/MaterialLegend';
import StratigraphySVG from './components/StratigraphySVG';
import { useMaterials } from '@/hooks/useMaterials';

interface ExtendedStratigraphyPreviewProps extends StratigraphyPreviewProps {
  showLayerCosts?: boolean;
  advancedBreakdown?: {
    materialCost: number;
    laborCost: number;
    screwCost: number;
    total: number;
    totalInstallTimeMinutes?: number;
  };
  useStoredCosts?: boolean;
}

const StratigraphyPreview = ({ 
  layers, 
  totalThickness, 
  className = '',
  showLayerCosts = false,
  advancedBreakdown,
  useStoredCosts = false
}: ExtendedStratigraphyPreviewProps) => {
  const sortedLayers = [...layers].sort((a, b) => a.position - b.position);
  const actualTotalThickness = calculateActualThickness(sortedLayers);

  // Load all materials for MaterialLegend
  const { data: allMaterials = [] } = useMaterials();

  console.log('[StratigraphyPreview] 🏗️ RENDERING SIMPLIFIED PREVIEW:', {
    layersCount: sortedLayers.length,
    actualTotalThickness,
    originalTotalThickness: totalThickness,
    showLayerCosts,
    layersWithScrews: sortedLayers.filter(l => l.screwCostPerSqm).length,
    layersData: sortedLayers.map(l => ({
      id: l.id,
      material: l.material?.name,
      screwMaterial: l.screwMaterial?.name,
      screwCostPerSqm: l.screwCostPerSqm
    }))
  });

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm sticky top-6 ${className}`}>
      <h3 className="font-medium mb-4 text-lg">Preview Stratigrafia</h3>
      
      {layers.length === 0 ? (
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-gray-500 text-sm">Aggiungi layer per vedere l'anteprima</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 bg-gray-50 rounded-lg p-2 overflow-hidden">
            <StratigraphySVG 
              layers={sortedLayers} 
              actualTotalThickness={actualTotalThickness}
            />
          </div>
          
          <div className="border-t pt-4">
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700">
                Spessore totale: <span className="text-lg font-bold text-construction-primary">{actualTotalThickness.toFixed(1)} mm</span>
              </div>
              <div className="text-xs text-gray-500">
                {layers.length} layer{layers.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <MaterialLegend 
              layers={sortedLayers} 
              materials={allMaterials}
              showLayerCosts={showLayerCosts}
              advancedBreakdown={advancedBreakdown}
              useStoredCosts={useStoredCosts}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default StratigraphyPreview;
