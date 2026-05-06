
import React from 'react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';
import { useMaterials } from '@/hooks/useMaterials';
import StratigraphyExportButton from '../StratigraphyExportButton';
import StratigraphyPreview from '../StratigraphyPreview';

interface StratigraphyDetailsProps {
  customStratigraphyData?: any;
  selectedStratigraphyData?: DatabaseStratigraphy;
  stratigraphy?: UnifiedStratigraphy;
  isStandalone?: boolean;
}

const StratigraphyDetails = ({ 
  customStratigraphyData, 
  selectedStratigraphyData, 
  stratigraphy,
  isStandalone = false 
}: StratigraphyDetailsProps) => {
  const { data: allMaterials = [] } = useMaterials();
  
  // Scegli la stratigrafia più recente da mostrare
  const currentStratigraphy = customStratigraphyData || selectedStratigraphyData || stratigraphy;

  // Prepara i layers per il preview IDENTICO al builder
  const layersForPreview = React.useMemo(() => {
    if (!currentStratigraphy?.layers) return [];

    return currentStratigraphy.layers.map((layer: any, index: number) => {
      const material = layer.materials || layer.material;
      
      return {
        id: layer.id || `layer-${index}`,
        position: layer.position || index + 1,
        materialId: layer.material_id || material?.id,
        material: material,
        thickness: layer.thickness || 0,
        interAxis: layer.inter_axis,
        // Dati viti integrati
        screwMaterialId: layer.screw_material_id,
        screwMaterial: layer.screw_materials,
        screwQuantity: layer.screw_quantity,
        screwCostPerSqm: layer.screw_cost_per_sqm,
        // Altri campi necessari
        category: material?.category || 'board',
        calculatedCostPerSqm: 0
      };
    });
  }, [currentStratigraphy]);

  // Usa i valori dal database se disponibili, altrimenti calcola
  const comprehensiveCost = React.useMemo(() => {
    if (currentStratigraphy?.comprehensive_cost_per_sqm) {
      // Usa i valori salvati nel database (solo valori reali dai layers)
      return {
        materialCost: currentStratigraphy.material_cost_per_sqm || 0,
        laborCost: currentStratigraphy.labor_cost_per_sqm || 0,
        screwCost: currentStratigraphy.screw_cost_per_sqm || 0,
        total: currentStratigraphy.comprehensive_cost_per_sqm || 0,
        totalInstallTimeMinutes: currentStratigraphy.installation_time_per_sqm || 0
      };
    }
    return null;
  }, [currentStratigraphy]);

  console.log('[StratigraphyDetails] 📊 USING DATABASE COSTS FROM REAL LAYERS:', {
    stratigraphyName: currentStratigraphy?.name,
    comprehensiveCost: comprehensiveCost?.total,
    source: currentStratigraphy?.comprehensive_cost_per_sqm ? 'DATABASE' : 'CALCULATED'
  });

  console.log('[StratigraphyDetails] 🎯 USING EXACT SAME PREVIEW AS BUILDER:', {
    stratigraphyName: currentStratigraphy?.name,
    layersCount: layersForPreview.length,
    comprehensiveCost: comprehensiveCost?.total
  });

  if (!currentStratigraphy) {
    return (
      <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
        <div className="opacity-40 text-4xl mb-3">📋</div>
        <div>Configura una stratigrafia per vedere i dettagli</div>
      </div>
    );
  }

  // Se è uno snapshot con dati completi, usa quelli
  const isSnapshot = currentStratigraphy.stratigraphy && 
    typeof currentStratigraphy.stratigraphy === 'object' && 
    currentStratigraphy.isSnapshot;

  const displayData = isSnapshot ? currentStratigraphy.stratigraphy : currentStratigraphy;
  const totalThickness = layersForPreview.reduce((sum, layer) => sum + (layer.thickness || 0), 0);

  return (
    <div className="w-full max-w-[390px] mx-auto lg:mx-0 flex flex-col gap-4 items-center justify-center h-full">
      <div className="w-full flex items-center justify-between mb-1">
        <h3 className="font-semibold text-lg truncate" title={displayData.name}>
          {customStratigraphyData 
            ? (customStratigraphyData.name || 'Stratigrafia Personalizzata') 
            : displayData?.name}
        </h3>
        {(selectedStratigraphyData || stratigraphy) && !isSnapshot && (
          <StratigraphyExportButton stratigraphy={selectedStratigraphyData || stratigraphy} />
        )}
      </div>

      {/* PREVIEW IDENTICO AL BUILDER - STESSO COMPONENTE CON STESSI PARAMETRI E BREAKDOWN */}
      <StratigraphyPreview 
        layers={layersForPreview}
        totalThickness={totalThickness}
        className="w-full"
        showLayerCosts={true}
        advancedBreakdown={comprehensiveCost}
        useStoredCosts={true} // 🎯 Modalità visualizzazione: usa costi salvati invece di calcoli live
      />
    </div>
  );
};

export default StratigraphyDetails;
