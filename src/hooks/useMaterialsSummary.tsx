import { useMemo } from 'react';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

export interface MaterialSummaryItem {
  materialId: string;
  materialName: string;
  materialCode: string;
  supplier: string;
  category: string;
  unit: string;
  unitPrice: number;
  totalQuantity: number;
  totalCost: number;
  stratigraphyNames: string[];
}

export const useMaterialsSummary = (estimateStratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[] = []) => {
  const materialsSummary = useMemo(() => {
    const materialsMap = new Map<string, MaterialSummaryItem>();

    console.log('[useMaterialsSummary] 🔍 PROCESSING STRATIGRAPHIES:', estimateStratigraphies.length);

    estimateStratigraphies.forEach((estStrat) => {
      console.log('[useMaterialsSummary] 📋 Processing stratigraphy:', {
        id: estStrat.id,
        name: estStrat.name,
        hasStratigraphy: !!estStrat.stratigraphy,
        hasLayers: !!estStrat.stratigraphy?.layers,
        layersCount: estStrat.stratigraphy?.layers?.length || 0,
        area: estStrat.area,
        wallHeight: estStrat.wallHeight
      });

      if (!estStrat.stratigraphy?.layers || !estStrat.area) {
        console.warn('[useMaterialsSummary] ⚠️ Skipping stratigraphy - missing layers or area:', estStrat.name);
        return;
      }

      // Default wallHeight se non presente
      const wallHeight = estStrat.wallHeight || 2.7;

      estStrat.stratigraphy.layers.forEach((layer: any) => {
        console.log('[useMaterialsSummary] 🔧 Processing layer:', {
          layerId: layer.id,
          position: layer.position,
          hasMaterials: !!layer.materials,
          materialName: layer.materials?.name,
          materialCategory: layer.materials?.category,
          hasScrewMaterials: !!layer.screw_materials,
          screwMaterialName: layer.screw_materials?.name,
          screwQuantity: layer.screw_quantity
        });

        if (!layer.materials) {
          console.warn('[useMaterialsSummary] ⚠️ Skipping layer - no materials:', layer.id);
          return;
        }

        const material = layer.materials;
        const materialKey = `${material.id}_${material.category}`;
        
        // Calcola la quantità per questo layer
        let quantity = 0;
        const incidence = material.incidence_per_sqm || 1;
        
        if (material.category === 'board' || material.category === 'insulation') {
          quantity = estStrat.area * incidence;
        } else if (material.category === 'structure_frame' || material.category === 'structure_guide') {
          const interAxis = layer.inter_axis || 600;
          if (material.category === 'structure_frame') {
            quantity = (estStrat.area / wallHeight) * (1000 / interAxis) * wallHeight;
          } else {
            quantity = (estStrat.area / wallHeight) * 2; // guide top e bottom
          }
        } else if (material.category === 'accessory') {
          quantity = estStrat.area * incidence;
        }

        console.log('[useMaterialsSummary] 💰 Material quantity calculated:', {
          materialName: material.name,
          category: material.category,
          quantity: quantity,
          incidence: incidence,
          area: estStrat.area
        });

        // 🔥 FIX: Aggiungi viti se presenti - SEMPRE, anche se quantity del materiale principale è 0
        if (layer.screw_materials && (layer.screw_quantity > 0 || layer.screw_cost_per_sqm > 0)) {
          const screwKey = `${layer.screw_materials.id}_screw`;
          
          // Calcola la quantità di viti basandosi su screw_quantity o screw_cost_per_sqm
          let screwQuantity = 0;
          if (layer.screw_quantity && layer.screw_quantity > 0) {
            screwQuantity = estStrat.area * layer.screw_quantity;
          } else if (layer.screw_cost_per_sqm && layer.screw_cost_per_sqm > 0 && layer.screw_materials.unit_price && layer.screw_materials.unit_price > 0) {
            // Se abbiamo solo screw_cost_per_sqm, calcoliamo la quantità dal costo
            screwQuantity = (estStrat.area * layer.screw_cost_per_sqm) / layer.screw_materials.unit_price;
          }

          console.log('[useMaterialsSummary] 🔩 SCREW CALCULATION:', {
            screwMaterialName: layer.screw_materials.name,
            screwKey: screwKey,
            screwQuantityFromLayer: layer.screw_quantity,
            screwCostPerSqm: layer.screw_cost_per_sqm,
            unitPrice: layer.screw_materials.unit_price,
            area: estStrat.area,
            calculatedScrewQuantity: screwQuantity,
            stratigraphyName: estStrat.name
          });
          
          if (screwQuantity > 0) {
            if (materialsMap.has(screwKey)) {
              const existing = materialsMap.get(screwKey)!;
              existing.totalQuantity += screwQuantity;
              existing.totalCost = existing.totalQuantity * existing.unitPrice;
              if (!existing.stratigraphyNames.includes(estStrat.name)) {
                existing.stratigraphyNames.push(estStrat.name);
              }
              console.log('[useMaterialsSummary] ➕ UPDATED existing screw:', {
                name: existing.materialName,
                newQuantity: existing.totalQuantity,
                newCost: existing.totalCost
              });
            } else {
              const newScrewItem = {
                materialId: layer.screw_materials.id,
                materialName: layer.screw_materials.name,
                materialCode: layer.screw_materials.code || '',
                supplier: layer.screw_materials.supplier || '',
                category: 'Viti',
                unit: layer.screw_materials.unit || 'pz',
                unitPrice: layer.screw_materials.unit_price || 0,
                totalQuantity: screwQuantity,
                totalCost: screwQuantity * (layer.screw_materials.unit_price || 0),
                stratigraphyNames: [estStrat.name]
              };
              
              materialsMap.set(screwKey, newScrewItem);
              console.log('[useMaterialsSummary] ✅ ADDED new screw:', {
                name: newScrewItem.materialName,
                quantity: newScrewItem.totalQuantity,
                cost: newScrewItem.totalCost,
                unitPrice: newScrewItem.unitPrice
              });
            }
          } else {
            console.warn('[useMaterialsSummary] ⚠️ Screw quantity is 0 or negative:', {
              screwMaterialName: layer.screw_materials.name,
              screwQuantity: screwQuantity,
              layer_screw_quantity: layer.screw_quantity,
              layer_screw_cost_per_sqm: layer.screw_cost_per_sqm
            });
          }
        } else {
          console.log('[useMaterialsSummary] ❌ No screw materials or quantity for layer:', {
            layerId: layer.id,
            hasScrewMaterials: !!layer.screw_materials,
            screwQuantity: layer.screw_quantity,
            screwCostPerSqm: layer.screw_cost_per_sqm
          });
        }

        // Aggiungi il materiale principale solo se la quantità è > 0
        if (quantity > 0) {
          if (materialsMap.has(materialKey)) {
            const existing = materialsMap.get(materialKey)!;
            existing.totalQuantity += quantity;
            existing.totalCost = existing.totalQuantity * existing.unitPrice;
            if (!existing.stratigraphyNames.includes(estStrat.name)) {
              existing.stratigraphyNames.push(estStrat.name);
            }
          } else {
            // Mappa le categorie per una migliore visualizzazione
            const categoryMap: Record<string, string> = {
              'board': 'Lastre',
              'structure_frame': 'Montanti',
              'structure_guide': 'Guide',
              'insulation': 'Isolamento',
              'accessory': 'Accessori',
              'screw': 'Viti',
              'other': 'Altri'
            };

            materialsMap.set(materialKey, {
              materialId: material.id,
              materialName: material.name,
              materialCode: material.code || '',
              supplier: material.supplier || '',
              category: categoryMap[material.category] || material.category,
              unit: material.unit || 'mq',
              unitPrice: material.unit_price || 0,
              totalQuantity: quantity,
              totalCost: quantity * (material.unit_price || 0),
              stratigraphyNames: [estStrat.name]
            });
          }
        }
      });
    });

    const result = Array.from(materialsMap.values()).sort((a, b) => {
      // Ordina per categoria, poi per nome
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.materialName.localeCompare(b.materialName);
    });

    console.log('[useMaterialsSummary] 🎯 FINAL MATERIALS SUMMARY:', {
      totalMaterials: result.length,
      screwMaterials: result.filter(m => m.category === 'Viti').length,
      materialNames: result.map(m => `${m.materialName} (${m.category})`),
      screwDetails: result.filter(m => m.category === 'Viti').map(s => ({
        name: s.materialName,
        quantity: s.totalQuantity,
        cost: s.totalCost,
        stratigraphies: s.stratigraphyNames
      }))
    });

    return result;
  }, [estimateStratigraphies]);

  const totalCost = useMemo(() => {
    return materialsSummary.reduce((sum, item) => sum + item.totalCost, 0);
  }, [materialsSummary]);

  // Calcola il costo totale manodopera da tutte le stratigrafie
  const totalLaborCost = useMemo(() => {
    return estimateStratigraphies.reduce((sum, estStrat) => {
      const laborCostPerSqm = estStrat.stratigraphy?.labor_cost_per_sqm || 0;
      return sum + (laborCostPerSqm * estStrat.area);
    }, 0);
  }, [estimateStratigraphies]);

  const totalByCategory = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    materialsSummary.forEach(item => {
      const current = categoryTotals.get(item.category) || 0;
      categoryTotals.set(item.category, current + item.totalCost);
    });
    return Object.fromEntries(categoryTotals);
  }, [materialsSummary]);

  return {
    materialsSummary,
    totalCost,
    totalLaborCost,
    totalByCategory,
    isEmpty: materialsSummary.length === 0
  };
};
