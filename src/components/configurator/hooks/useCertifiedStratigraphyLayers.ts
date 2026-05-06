
import { useState, useCallback, useMemo } from 'react';
import { MaterialCategory } from '@/types';
import { calculateTotalThicknessExcludingGuides } from '../utils/stratigraphyUtils';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
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
      // For structural materials, typically the second dimension is the width
      return parseInt(match[2]);
    }
  }
  
  // Look for explicit width mentions
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

export const useCertifiedStratigraphyLayers = () => {
  const [layers, setLayers] = useState<Layer[]>([]);

  const handleAddLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}-${Math.random()}`,
      materialId: '',
      thickness: 10,
      position: layers.length + 1,
      category: 'board' as MaterialCategory,
      interAxis: 600, // Default 600mm
    };
    setLayers(prev => [...prev, newLayer]);
    return newLayer;
  }, [layers.length]);

  const handleRemoveLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId).map((layer, index) => ({
      ...layer,
      position: index + 1
    })));
  }, []);

  const handleUpdateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  const handleMoveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(layer => layer.id === layerId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      
      // Update positions
      return newLayers.map((layer, idx) => ({ ...layer, position: idx + 1 }));
    });
  }, []);

  const totalThickness = useMemo(() => {
    // Use the corrected calculation that excludes guides
    return calculateTotalThicknessExcludingGuides(layers);
  }, [layers]);

  const structureWidth = useMemo(() => {
    console.log('useCertifiedStratigraphyLayers - Calculating structure width from layers:', layers);
    
    const structureLayers = layers.filter(layer => layer.category === 'structure_frame');
    console.log('useCertifiedStratigraphyLayers - Structure frame layers:', structureLayers);
    
    let maxWidth = 0;
    
    structureLayers.forEach(layer => {
      console.log('useCertifiedStratigraphyLayers - Layer material:', layer.material);
      if (layer.material) {
        // Try different possible property names for width
        let width = layer.material.width || 
                   layer.material.larghezza || 
                   layer.material.dimension || 
                   layer.material.size;
        
        // If no direct width property, try to extract from description
        if (!width && layer.material.description) {
          width = extractWidthFromDescription(layer.material.description);
        }
        
        console.log('useCertifiedStratigraphyLayers - Found width:', width);
        if (width && width > maxWidth) {
          maxWidth = width;
        }
      }
    });
    
    console.log('useCertifiedStratigraphyLayers - Final structure width:', maxWidth);
    return maxWidth;
  }, [layers]);

  // Calculate costs
  const materialCost = useMemo(() => {
    return layers.reduce((total, layer) => {
      if (!layer.material) return total;
      
      let cost = 0;
      if (layer.material.category === 'structure_frame') {
        const interAxis = layer.interAxis || 600;
        const incidenceBase = layer.material.incidence_base || layer.material.incidence_per_sqm || 1;
        const calculatedIncidence = incidenceBase * (600 / interAxis);
        cost = calculatedIncidence * (layer.material.unit_price || 0);
      } else {
        const incidence = layer.material.incidence_per_sqm || 1;
        cost = (layer.material.unit_price || 0) * incidence;
      }
      
      return total + cost;
    }, 0);
  }, [layers]);

  const screwCost = useMemo(() => {
    return layers.reduce((total, layer) => {
      return total + (layer.screwCostPerSqm || 0);
    }, 0);
  }, [layers]);

  const installationTime = useMemo(() => {
    return layers.reduce((total, layer) => {
      if (!layer.material) return total;
      
      let time = 0;
      if (layer.material.category === 'structure_frame') {
        const interAxis = layer.interAxis || 600;
        const incidenceBase = layer.material.incidence_base || layer.material.incidence_per_sqm || 1;
        const calculatedIncidence = incidenceBase * (600 / interAxis);
        time = calculatedIncidence * (layer.material.installation_time_per_sqm || 0);
      } else {
        const incidence = layer.material.incidence_per_sqm || 1;
        time = incidence * (layer.material.installation_time_per_sqm || 0);
      }
      
      // Add screw installation time
      if (layer.screwQuantity) {
        time += layer.screwQuantity * 0.03; // 0.03 minutes per screw
      }
      
      return total + time;
    }, 0);
  }, [layers]);

  const laborCost = useMemo(() => {
    // Assuming 30€/hour labor cost, convert minutes to hours
    return (installationTime * 30) / 60;
  }, [installationTime]);

  const comprehensiveCost = useMemo(() => {
    return materialCost + screwCost + laborCost;
  }, [materialCost, screwCost, laborCost]);

  const weightPerSqm = useMemo(() => {
    return layers.reduce((total, layer) => {
      if (!layer.material) return total;
      
      const incidence = layer.material.incidence_per_sqm || 1;
      const weight = (layer.material.weight_per_sqm || 0) * incidence;
      
      return total + weight;
    }, 0);
  }, [layers]);

  const accessoriesCost = useMemo(() => {
    // Simple calculation: 10% of material cost
    return materialCost * 0.1;
  }, [materialCost]);

  const isValid = useMemo(() => {
    return layers.length > 0 && layers.every(layer => layer.materialId && layer.thickness > 0);
  }, [layers]);

  return {
    layers,
    setLayers,
    handleAddLayer,
    handleRemoveLayer,
    handleUpdateLayer,
    handleMoveLayer,
    totalThickness,
    structureWidth,
    comprehensiveCost,
    materialCost,
    laborCost,
    screwCost,
    installationTime,
    weightPerSqm,
    accessoriesCost,
    isValid
  };
};
