
import { useState, useCallback, useMemo } from 'react';
import { MaterialCategory } from '@/types';
import { calculateTotalThicknessExcludingGuides } from '../utils/stratigraphyUtils';
import { calculateLayerCostPerSqm } from '../utils/costCalculationUtils';
import { useMaterials } from '@/hooks/useMaterials';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
  calculatedCostPerSqm?: number;
  // NEW: Integrated screw fields
  screwMaterialId?: string;
  screwMaterial?: any;
  screwQuantity?: number;
  screwCostPerSqm?: number;
}

// Helper function to extract width from material description
const extractWidthFromDescription = (description: string): number | null => {
  if (!description) return null;
  
  // Look for dimension patterns like "Dimensione: 51x50x47" or "51x50x47"
  const dimensionPatterns = [
    /Dimensione:\s*(\d+)x(\d+)x(\d+)/i,
    /Dimensioni:\s*(\d+)x(\d+)x(\d+)/i,
    /(\d+)x(\d+)x(\d+)\s*mm/i,
    /(\d+)x(\d+)x(\d+)/i,
  ];
  
  for (const pattern of dimensionPatterns) {
    const match = description.match(pattern);
    if (match) {
      return parseInt(match[2]);
    }
  }
  
  const widthPatterns = [
    /larghezza[:\s]*(\d+)/i,
    /width[:\s]*(\d+)/i,
    /(\d+)\s*mm\s*larghezza/i,
    /(\d+)\s*mm\s*width/i,
  ];
  
  for (const pattern of widthPatterns) {
    const match = description.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return null;
};

export const useSharedStratigraphyLayers = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const { data: allMaterials = [] } = useMaterials();

  const handleAddLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}-${Math.random()}`,
      materialId: '',
      thickness: 10,
      position: layers.length + 1,
      category: 'board' as MaterialCategory,
      interAxis: 600,
      calculatedCostPerSqm: 0,
      // NEW: Initialize screw fields
      screwMaterialId: undefined,
      screwMaterial: undefined,
      screwQuantity: undefined,
      screwCostPerSqm: 0,
    };
    setLayers(prev => [...prev, newLayer]);
    return newLayer;
  }, [layers.length]);

  const initializeFromStratigraphy = useCallback((stratigraphy: any) => {
    console.log('🔄 [useSharedStratigraphyLayers] INIZIALIZZAZIONE COMPLETA da stratigraphy:', {
      id: stratigraphy?.id,
      name: stratigraphy?.name,
      is_certified: stratigraphy?.is_certified,
      hasLayers: !!stratigraphy?.layers,
      layersCount: stratigraphy?.layers?.length || 0
    });

    // Identifica la fonte corretta dei layers
    let effectiveLayers: any[] | undefined = undefined;
    let sourceType = 'none';
    
    if (stratigraphy?.layers && Array.isArray(stratigraphy.layers)) {
      effectiveLayers = stratigraphy.layers;
      sourceType = 'stratigraphy.layers';
    } else if (stratigraphy?.layersData && Array.isArray(stratigraphy.layersData)) {
      effectiveLayers = stratigraphy.layersData;
      sourceType = 'stratigraphy.layersData';
    } else if (stratigraphy?.layers_data && Array.isArray(stratigraphy.layers_data)) {
      effectiveLayers = stratigraphy.layers_data;
      sourceType = 'stratigraphy.layers_data';
    }

    console.log(`📊 [useSharedStratigraphyLayers] FONTE LAYERS: ${sourceType} - Count: ${effectiveLayers?.length || 0}`);

    if (effectiveLayers && effectiveLayers.length > 0) {
      console.log('🔧 [useSharedStratigraphyLayers] PROCESSAMENTO LAYERS AVANZATO...');
      
      const initializedLayers = effectiveLayers.map((layer: any, index: number) => {
        console.log(`📋 [useSharedStratigraphyLayers] LAYER ${index + 1} - DATI COMPLETI:`, {
          id: layer.id,
          material_id: layer.material_id,
          materialId: layer.materialId,
          position: layer.position,
          thickness: layer.thickness,
          inter_axis: layer.inter_axis,
          interAxis: layer.interAxis,
          // Screw fields from database
          screw_material_id: layer.screw_material_id,
          screwMaterialId: layer.screwMaterialId,
          screw_quantity: layer.screw_quantity,
          screwQuantity: layer.screwQuantity,
          screw_cost_per_sqm: layer.screw_cost_per_sqm,
          screwCostPerSqm: layer.screwCostPerSqm,
          // Material objects
          materials: !!layer.materials,
          material: !!layer.material,
          screw_materials: !!layer.screw_materials,
          screwMaterial: !!layer.screwMaterial
        });
        
        // Estrai i dati del materiale principale
        const material = layer.materials || layer.material;
        const interAxis = layer.inter_axis || layer.interAxis;
        const calculatedCost = material ? calculateLayerCostPerSqm(material, interAxis) : 0;
        
        // 🔥 CRITICAL: Gestisci i dati delle viti integrate
        const screwMaterialId = layer.screw_material_id || layer.screwMaterialId;
        const screwQuantity = layer.screw_quantity || layer.screwQuantity;
        const screwCostPerSqm = layer.screw_cost_per_sqm || layer.screwCostPerSqm || 0;
        
        // Trova il materiale della vite se presente
        let screwMaterial = layer.screw_materials || layer.screwMaterial;
        if (!screwMaterial && screwMaterialId) {
          screwMaterial = allMaterials.find(m => m.id === screwMaterialId);
        }
        
        if (screwMaterial) {
          console.log(`🔩 [useSharedStratigraphyLayers] SCREW MATERIAL INTEGRATO:`, {
            screwMaterialId,
            screwMaterialName: screwMaterial?.name,
            screwQuantity,
            screwCostPerSqm
          });
        }
        
        // Costruisci il layer finale con dati integrati completi
        const newLayer = {
          id: layer.id || `layer-${Date.now()}-${index}`,
          materialId: layer.material_id || layer.materialId || '',
          material,
          thickness: layer.thickness || 10,
          position: layer.position || index + 1,
          category: (material?.category || 'board') as MaterialCategory,
          interAxis,
          calculatedCostPerSqm: calculatedCost,
          // 🔥 CRITICAL: Integrated screw fields completamente mappati
          screwMaterialId,
          screwMaterial,
          screwQuantity,
          screwCostPerSqm,
        };
        
        console.log(`📦 [useSharedStratigraphyLayers] LAYER ${index + 1} FINALE COMPLETO:`, {
          materialId: newLayer.materialId,
          materialName: material?.name || 'N/A',
          thickness: newLayer.thickness,
          position: newLayer.position,
          category: newLayer.category,
          // Screw data fully mapped
          hasScrews: !!newLayer.screwMaterialId,
          screwName: newLayer.screwMaterial?.name,
          screwQuantity: newLayer.screwQuantity,
          calculatedCost: calculatedCost,
          screwCost: screwCostPerSqm,
          layerComplete: !!(newLayer.materialId && newLayer.material)
        });
        
        return newLayer;
      });

      console.log('✅ [useSharedStratigraphyLayers] INIZIALIZZAZIONE LAYERS COMPLETATA:', {
        totalLayers: initializedLayers.length,
        layersWithMaterials: initializedLayers.filter(l => l.material).length,
        layersWithScrews: initializedLayers.filter(l => l.screwMaterialId).length,
        allLayersValid: initializedLayers.every(l => l.materialId && l.material)
      });
      
      setLayers(initializedLayers);
    } else {
      console.warn('❌ [useSharedStratigraphyLayers] NESSUN LAYER TROVATO nella stratigraphy');
      setLayers([]);
    }
  }, [allMaterials]);

  const totalThickness = useMemo(() => {
    console.log('[useSharedStratigraphyLayers] 📏 THICKNESS CALCULATION - layers:', layers.length);
    return calculateTotalThicknessExcludingGuides(layers);
  }, [layers]);

  const structureWidth = useMemo(() => {
    console.log('useSharedStratigraphyLayers - Calculating structure width from layers:', layers);
    
    const structureLayers = layers.filter(layer => layer.category === 'structure_frame');
    console.log('useSharedStratigraphyLayers - Structure frame layers:', structureLayers);
    
    let maxWidth = 0;
    
    structureLayers.forEach(layer => {
      console.log('useSharedStratigraphyLayers - Layer material:', layer.material);
      if (layer.material) {
        let width = layer.material.width || 
                   layer.material.larghezza || 
                   layer.material.dimension || 
                   layer.material.size;
        
        if (!width && layer.material.description) {
          width = extractWidthFromDescription(layer.material.description);
        }
        
        console.log('useSharedStratigraphyLayers - Found width:', width);
        if (width && width > maxWidth) {
          maxWidth = width;
        }
      }
    });
    
    console.log('useSharedStratigraphyLayers - Final structure width:', maxWidth);
    return maxWidth;
  }, [layers]);

  // Calculate material cost including integrated screws
  const estimatedMaterialsCost = useMemo(() => {
    const cost = layers.reduce((sum, layer) => {
      const layerCost = (layer.calculatedCostPerSqm || 0) + (layer.screwCostPerSqm || 0);
      return sum + layerCost;
    }, 0);
    
    console.log(`[useSharedStratigraphyLayers] 💰 INTEGRATED MATERIALS COST: €${cost.toFixed(2)}`);
    return cost;
  }, [layers]);

  const screwsCost = 0;
  const accessoriesCost = 0;

  // Total cost (now all integrated)
  const estimatedCost = useMemo(() => {
    console.log(`[useSharedStratigraphyLayers] 💸 TOTAL INTEGRATED COST: €${estimatedMaterialsCost.toFixed(2)}`);
    return estimatedMaterialsCost;
  }, [estimatedMaterialsCost]);

  // Calculate weight per m² including screws
  const weightPerSqm = useMemo(() => {
    return layers.reduce((sum, layer) => {
      let weight = 0;
      
      // Main material weight
      if (layer.material && layer.materialId) {
        const incidence = layer.material.incidence_per_sqm || 1;
        weight += (layer.material.weight_per_sqm || 0) * incidence;
      }
      
      // Screw weight if present
      if (layer.screwMaterial && layer.screwQuantity) {
        const screwWeight = (layer.screwMaterial.weight_per_sqm || 0) * (layer.screwQuantity / 1000); // Convert from g to kg
        weight += screwWeight;
      }
      
      return sum + weight;
    }, 0);
  }, [layers]);

  // Count valid layers (with material and thickness)
  const validLayersCount = useMemo(() => {
    return layers.filter(layer => layer.materialId && layer.thickness > 0).length;
  }, [layers]);

  return {
    layers,
    setLayers,
    handleAddLayer,
    initializeFromStratigraphy,
    totalThickness,
    structureWidth,
    estimatedCost,
    weightPerSqm,
    validLayersCount,
    screwsCost,
    accessoriesCost
  };
};
