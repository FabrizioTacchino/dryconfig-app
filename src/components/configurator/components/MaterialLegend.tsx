
import React from 'react';
import { MaterialLegendProps } from '../types/StratigraphyTypes';
import { isInsulation, isStructure } from '../utils/stratigraphyUtils';
import { DatabaseMaterial } from '@/hooks/useMaterials';

// Simplified MaterialLegendProps without editable accessories
interface MaterialLegendExtendedProps extends MaterialLegendProps {
  materials?: DatabaseMaterial[];
  showLayerCosts?: boolean;
  advancedBreakdown?: {
    materialCost: number;
    laborCost: number;
    screwCost: number;
    total: number;
    totalInstallTimeMinutes?: number;
  };
  useStoredCosts?: boolean; // Flag to use stored costs instead of live calculations
}

// Helper per ottenere l'emoji basata sulla categoria del materiale
const getMaterialEmoji = (category: string) => {
  switch (category) {
    case 'board':
      return '🟥';
    // Rosso per le lastre
    case 'structure_frame':
      return '⬛';
    // Nero per montanti
    case 'structure_guide':
      return '⬛';
    // Nero per guide
    case 'insulation':
      return '🟨';
    // Giallo per isolanti
    case 'screw':
      return '🔩';
    // Viti
    case 'accessory':
      return '🔧';
    // Accessori
    default:
      return '🟦';
    // Blu per altri materiali
  }
};

// Helper per determinare se un materiale è strutturale
const isStructuralMaterial = (category: string) => {
  return ['board', 'structure_frame', 'structure_guide', 'insulation'].includes(category);
};

// Helper per determinare se un materiale è un accessorio puro (non viti integrate)
const isPureAccessoryMaterial = (category: string) => {
  return ['screw', 'accessory'].includes(category);
};

const MaterialLegend = ({
  layers,
  materials = [],
  showLayerCosts = false,
  advancedBreakdown,
  useStoredCosts = false
}: MaterialLegendExtendedProps) => {
  const sortedLayers = [...layers].sort((a, b) => a.position - b.position);

  // Separate structural materials from pure accessories
  const structuralLayers = sortedLayers.filter(layer => isStructuralMaterial(layer.material?.category || ''));

  // Solo materiali con categoria screw o accessory (NON layer strutturali con viti integrate)
  const pureAccessoryLayers = sortedLayers.filter(layer => isPureAccessoryMaterial(layer.material?.category || ''));

  // Estrai le viti integrate dai layer strutturali per creare voci separate
  const integratedScrews: Array<{
    id: string;
    screwMaterial: DatabaseMaterial;
    quantity: number;
    costPerSqm: number;
    fromLayer: string;
  }> = [];
  structuralLayers.forEach(layer => {
    if (layer.screwMaterial && layer.screwQuantity && layer.screwCostPerSqm) {
      integratedScrews.push({
        id: `${layer.id}_screw`,
        screwMaterial: layer.screwMaterial,
        quantity: layer.screwQuantity,
        costPerSqm: layer.screwCostPerSqm,
        fromLayer: layer.material?.name || 'Layer sconosciuto'
      });
    }
  });

  // Funzione per calcolare il costo di un singolo layer
  const calculateLayerCost = (layer: any) => {
    if (!layer.material) return 0;
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
    return materialCost;
  };

  // 🕒 FUNZIONE PER CALCOLARE IL TEMPO DI INSTALLAZIONE DI UN LAYER
  const calculateLayerInstallationTime = (layer: any) => {
    if (!layer.material) return 0;
    let installationTime = 0;
    const baseInstallationTime = layer.material.installation_time_per_sqm || 0;
    if (layer.material.category === 'structure_frame') {
      const interAxis = layer.interAxis || 600;
      const incidenceBase = layer.material.incidence_base || layer.material.incidence_per_sqm || 1;
      const calculatedIncidence = incidenceBase * (600 / interAxis);
      installationTime = calculatedIncidence * baseInstallationTime;
    } else if (layer.material.category === 'structure_guide') {
      const incidence = layer.material.incidence_per_sqm || 1;
      installationTime = incidence * baseInstallationTime;
    } else if (layer.material.category === 'board') {
      const incidence = layer.material.incidence_per_sqm || 1;
      installationTime = incidence * baseInstallationTime;
    } else {
      const incidence = layer.material.incidence_per_sqm || 1;
      installationTime = incidence * baseInstallationTime;
    }
    return installationTime;
  };

  // 🎯 CORREZIONE CRITICA: Sempre ricalcolare i materiali per mantenere la precisione
  // I valori stored dal database perdono precisione negli arrotondamenti
  const structuralMaterialsCost = structuralLayers.reduce((sum, layer) => sum + calculateLayerCost(layer), 0);

  // 🔥 CORREZIONE ARROTONDAMENTO VITI: Applica la stessa logica del preview
  const pureAccessoriesCost = useStoredCosts && advancedBreakdown 
    ? 0 // Gli accessori sono già inclusi nel screw_cost del breakdown salvato
    : pureAccessoryLayers.reduce((sum, layer) => sum + calculateLayerCost(layer), 0);
    
  // Calcola il costo delle viti integrate con arrotondamento corretto
  const integratedScrewsCost = useStoredCosts && advancedBreakdown 
    ? advancedBreakdown.screwCost 
    : integratedScrews.reduce((sum, screw) => {
        const rawCost = screw.costPerSqm;
        // 🎯 CORREZIONE: Applica lo stesso arrotondamento del preview
        let roundedCost;
        if (rawCost * 1000 % 10 === 8) {
          // Se la terza cifra decimale è 8, arrotonda per eccesso
          roundedCost = Math.ceil(rawCost * 100) / 100;
        } else {
          // Arrotondamento normale
          roundedCost = Math.round(rawCost * 100) / 100;
        }
        return sum + roundedCost;
      }, 0);
    
  const totalAccessoriesCost = pureAccessoriesCost + integratedScrewsCost;
  const totalMaterialsCost = structuralMaterialsCost + totalAccessoriesCost;

  // 🎯 MODALITÀ STORED COSTS: Usa anche i tempi salvati invece di calcolare live
  const structuralInstallationTime = useStoredCosts && advancedBreakdown 
    ? advancedBreakdown.totalInstallTimeMinutes || 0
    : structuralLayers.reduce((sum, layer) => sum + calculateLayerInstallationTime(layer), 0);
    
  const pureAccessoryInstallationTime = useStoredCosts && advancedBreakdown 
    ? 0 // I tempi accessori sono già inclusi nel tempo totale salvato
    : pureAccessoryLayers.reduce((sum, layer) => sum + calculateLayerInstallationTime(layer), 0);
    
  const integratedScrewsInstallationTime = useStoredCosts && advancedBreakdown 
    ? 0 // I tempi viti sono già inclusi nel tempo totale salvato
    : integratedScrews.reduce((sum, screw) => {
        const totalScrewTime = screw.quantity * 0.03; // 0.03 minutes per vite
        return sum + totalScrewTime;
      }, 0);
      
  const totalAccessoryInstallationTime = pureAccessoryInstallationTime + integratedScrewsInstallationTime;
  const totalInstallationTime = useStoredCosts && advancedBreakdown 
    ? advancedBreakdown.totalInstallTimeMinutes || 0
    : structuralInstallationTime + totalAccessoryInstallationTime;
  
  if (!showLayerCosts) {
    // Layout originale per retrocompatibilità
    return <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Legenda:</h4>
        {sortedLayers.map((layer, index) => {
        const prevLayer = index > 0 ? sortedLayers[index - 1] : null;
        const isInsulationInStructure = isInsulation(layer.material) && prevLayer && isStructure(prevLayer.material);
        return <div key={layer.id} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded border" style={{
            backgroundColor: layer.material?.color_hex || '#CCCCCC'
          }} />
              <span className="flex-1">{layer.material?.name || 'Materiale non specificato'}</span>
              <span className="text-gray-500">{layer.thickness}mm</span>
              {isInsulationInStructure && <span className="text-orange-600 text-xs">(interno struttura)</span>}
            </div>;
      })}
      </div>;
  }
  
  return <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Legenda:</h4>
      
      {/* SEZIONE MATERIALI STRUTTURALI */}
      {structuralLayers.length > 0 && <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">🏗️ Materiali Strutturali:</div>
          {structuralLayers.map((layer, index) => {
        const prevLayer = index > 0 ? structuralLayers[index - 1] : null;
        const isInsulationInStructure = isInsulation(layer.material) && prevLayer && isStructure(prevLayer.material);
        const layerCost = calculateLayerCost(layer);
        const layerTime = calculateLayerInstallationTime(layer);
        const emoji = getMaterialEmoji(layer.material?.category || '');
              return <div key={layer.id} className="space-y-0">
                {/* Materiale e prezzo sulla stessa riga */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{
                      backgroundColor: layer.material?.color_hex || '#CCCCCC'
                    }} />
                    <span className="flex-1">
                      {layer.material?.name || 'Materiale non specificato'}
                      {isInsulationInStructure && <span className="text-orange-600 text-xs ml-1">(interno struttura)</span>}
                    </span>
                  </div>
                  <div className={`font-medium ${layerCost === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                    €{layerCost.toFixed(2)}/m²
                  </div>
                </div>
                
                {/* Spessore e tempo immediatamente sotto, allineati - CON 2 DECIMALI */}
                <div className="flex justify-between ml-5 text-xs text-gray-500">
                  <span>Spessore: {layer.thickness}mm</span>
                  <span>{layerTime.toFixed(2)} min/m²</span>
                </div>
              </div>;
      })}
          
          {/* Riga separatrice materiali strutturali */}
          <div className="border-t border-dotted border-gray-300 pt-2 mt-3">
            <div className="flex justify-between text-sm text-gray-700 font-semibold">
              <span>Sommano Materiali Strutturali</span>
              <div className="text-right">
                <div>€{structuralMaterialsCost.toFixed(2)}/m²</div>
                <div className="text-xs font-normal">{structuralInstallationTime.toFixed(2)} min/m²</div>
              </div>
            </div>
          </div>
        </div>}

      {/* SEZIONE ACCESSORI E FINITURE */}
      {(pureAccessoryLayers.length > 0 || integratedScrews.length > 0) && <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">🔧 Accessori e Finiture:</div>
          
          {/* Accessori puri */}
          {pureAccessoryLayers.map(layer => {
        const layerCost = calculateLayerCost(layer);
        const layerTime = calculateLayerInstallationTime(layer);
        const emoji = getMaterialEmoji(layer.material?.category || '');
                return <div key={layer.id} className="space-y-0">
                {/* Materiale e prezzo sulla stessa riga */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{
                      backgroundColor: layer.material?.color_hex || '#CCCCCC'
                    }} />
                    <span className="flex-1">
                      {layer.material?.name || 'Materiale non specificato'}
                    </span>
                  </div>
                  <div className={`font-medium ${layerCost === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                    €{layerCost.toFixed(2)}/m²
                  </div>
                </div>
                
                {/* Spessore e tempo immediatamente sotto (se presente) - CON 2 DECIMALI */}
                {layer.thickness && (
                  <div className="flex justify-between ml-5 text-xs text-gray-500">
                    <span>Spessore: {layer.thickness}mm</span>
                    <span>{layerTime.toFixed(2)} min/m²</span>
                  </div>
                )}
                
                {/* Solo tempo se non c'è spessore - CON 2 DECIMALI */}
                {!layer.thickness && (
                  <div className="ml-5 text-xs text-gray-500 text-right">
                    {layerTime.toFixed(2)} min/m²
                  </div>
                )}
              </div>;
      })}

          {/* Viti integrate come voci separate - CON ARROTONDAMENTO CORRETTO */}
          {integratedScrews.map(screw => {
        const totalScrewTime = screw.quantity * 0.03; // 0.03 minutes per vite
        
        // 🎯 CORREZIONE: Applica arrotondamento corretto per la visualizzazione
        const rawCost = screw.costPerSqm;
        let displayCost;
        if (rawCost * 1000 % 10 === 8) {
          // Se la terza cifra decimale è 8, arrotonda per eccesso
          displayCost = Math.ceil(rawCost * 100) / 100;
        } else {
          // Arrotondamento normale
          displayCost = Math.round(rawCost * 100) / 100;
        }

        return <div key={screw.id} className="space-y-0">
                {/* Materiale e prezzo sulla stessa riga */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{
                      backgroundColor: screw.screwMaterial.color_hex || '#888888'
                    }} />
                    <span className="flex-1">
                      {screw.screwMaterial.name}
                    </span>
                  </div>
                  <div className="font-medium text-gray-700">
                    €{displayCost.toFixed(2)}/m²
                  </div>
                </div>
                
                {/* Dettaglio e tempo immediatamente sotto - CON 2 DECIMALI */}
                <div className="flex justify-between ml-5 text-xs text-gray-500">
                  <span>Per: {screw.fromLayer}</span>
                  <span>{totalScrewTime.toFixed(2)} min/m²</span>
                </div>
              </div>;
      })}
          
          {/* Riga separatrice accessori */}
          <div className="border-t border-dotted border-gray-300 pt-2 mt-3">
            <div className="flex justify-between text-sm text-gray-700 font-semibold">
              <span>Sommano Accessori e Finiture</span>
              <div className="text-right">
                <div>€{totalAccessoriesCost.toFixed(2)}/m²</div>
                <div className="text-xs font-normal">{totalAccessoryInstallationTime.toFixed(2)} min/m²</div>
              </div>
            </div>
          </div>
        </div>}

      {/* RIEPILOGO FINALE - ALWAYS SHOW WHEN showLayerCosts IS TRUE */}
      {showLayerCosts && <div className="border-t border-gray-300 pt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <span className="font-semibold text-sm text-gray-800">Riepilogo Complessivo</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Costo Materiali:</span>
                <span className="font-medium text-gray-800">€{totalMaterialsCost.toFixed(2)}/m²</span>
              </div>
              
              {/* 🕒 TEMPO DI INSTALLAZIONE - CON 2 DECIMALI */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 text-xs">Tempo Installazione:</span>
                <span className="text-gray-400 text-xs">
                  {totalInstallationTime.toFixed(2)} min/m²
                </span>
              </div>
              
              {/* CONVERSIONE IN ORE - CON 2 DECIMALI */}
              <div className="flex justify-between text-xs text-gray-400">
                <span>Equivalente a:</span>
                <span>{(totalInstallationTime / 60).toFixed(2)} ore/m²</span>
              </div>
              
              {advancedBreakdown?.laborCost && <div className="flex justify-between">
                  <span className="text-gray-600">Manodopera:</span>
                  <span className="font-medium text-gray-800">€{advancedBreakdown.laborCost.toFixed(2)}/m²</span>
                </div>}
            </div>
            
            {advancedBreakdown?.laborCost && <div className="border-t border-gray-400 my-3 pt-2">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-gray-800">Totale:</span>
                  <span className="text-gray-900">
                    {/* 🔥 CORREZIONE FINALE: Usa SEMPRE advancedBreakdown.total per precisione massima */}
                    €{(advancedBreakdown?.total !== undefined 
                      ? advancedBreakdown.total.toFixed(2)
                      : (totalMaterialsCost + (advancedBreakdown?.laborCost || 0)).toFixed(2)
                    )}/m²
                  </span>
                </div>
              </div>}
          </div>
        </div>}
    </div>;
};

export default MaterialLegend;
