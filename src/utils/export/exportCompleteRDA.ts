import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Estimate } from '@/types';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateActualThickness, 
  identifyStructuralGroups, 
  isGuide, 
  isAccessory, 
  getLayerActualThickness,
  isStructure,
  isInsulation,
  isBoard
} from '@/components/configurator/utils/stratigraphyUtils';

interface StratigraphyMaterial {
  materialName: string;
  materialCode: string;
  category: string;
  supplier: string;
  thickness: number;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  unit: string;
  specifications?: string;
  installationTime?: number;
}

interface ProjectInfo {
  name: string;
  client: string;
  description: string;
}

interface MaterialLegendItem {
  name: string;
  code: string;
  category: string;
  supplier: string;
  color: string;
  thickness?: number;
  cost: number;
  installationTime: number;
  specifications?: string;
}

// Helper per ottenere emoji per categoria
const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case 'board': return '🟥';
    case 'structure_frame': return '⬛';
    case 'structure_guide': return '⬛';
    case 'insulation': return '🟨';
    case 'screw': return '🔩';
    case 'accessory': return '🔧';
    default: return '🟦';
  }
};

// Helper per determinare se un materiale è strutturale
const isStructuralMaterial = (category: string): boolean => {
  return ['board', 'structure_frame', 'structure_guide', 'insulation'].includes(category);
};

// Helper function to safely access nested layer data
const getLayersFromStratigraphy = (stratigraphy: EstimateStratigraphy & { stratigraphy?: any }): any[] => {
  console.log('[RDA Export] 🔍 Accessing layers for:', stratigraphy.name);
  
  // For snapshots, use layersData
  if (stratigraphy.isSnapshot && stratigraphy.layersData) {
    console.log('[RDA Export] 📸 Using snapshot layersData:', stratigraphy.layersData.length, 'layers');
    const layers = Array.isArray(stratigraphy.layersData) ? stratigraphy.layersData : [];
    
    layers.forEach((layer, index) => {
      console.log(`[RDA Export] Layer ${index}:`, {
        hasMaterial: !!layer.material,
        materialName: layer.material?.name || 'MISSING',
        materialCode: layer.material?.code || 'MISSING',
        thickness: layer.thickness
      });
    });
    
    return layers;
  }
  
  // For regular stratigraphies, use stratigraphy.layers
  if (stratigraphy.stratigraphy?.layers) {
    console.log('[RDA Export] 🏗️ Using stratigraphy layers:', stratigraphy.stratigraphy.layers.length, 'layers');
    const layers = stratigraphy.stratigraphy.layers;
    
    layers.forEach((layer, index) => {
      console.log(`[RDA Export] Layer ${index}:`, {
        hasMaterial: !!layer.material,
        materialName: layer.material?.name || 'MISSING',
        materialCode: layer.material?.code || 'MISSING',
        thickness: layer.thickness
      });
    });
    
    return layers;
  }
  
  console.log('[RDA Export] ⚠️ No layers found for:', stratigraphy.name);
  return [];
};

// Funzione per calcolare costo di un layer
const calculateLayerCost = (layer: any): number => {
  if (!layer.material) return 0;
  
  let materialCost = 0;
  const material = layer.material;
  
  if (material.category === 'structure_frame') {
    const interAxis = layer.interAxis || 600;
    const incidenceBase = material.incidence_base || material.incidence_per_sqm || 1;
    const calculatedIncidence = incidenceBase * (600 / interAxis);
    materialCost = calculatedIncidence * material.unit_price;
  } else {
    const incidence = material.incidence_per_sqm || 1;
    materialCost = incidence * material.unit_price;
  }
  
  return materialCost;
};

// Funzione per calcolare tempo installazione di un layer
const calculateLayerInstallationTime = (layer: any): number => {
  if (!layer.material) return 0;
  
  const material = layer.material;
  const baseInstallationTime = material.installation_time_per_sqm || 0;
  
  if (material.category === 'structure_frame') {
    const interAxis = layer.interAxis || 600;
    const incidenceBase = material.incidence_base || material.incidence_per_sqm || 1;
    const calculatedIncidence = incidenceBase * (600 / interAxis);
    return calculatedIncidence * baseInstallationTime;
  } else {
    const incidence = material.incidence_per_sqm || 1;
    return incidence * baseInstallationTime;
  }
};

// Generazione SVG migliorata per PDF con colori e pattern identici all'UI
const generateProfessionalSVG = (layers: any[], actualTotalThickness: number): string => {
  if (layers.length === 0) {
    console.log('[RDA Export] ⚠️ No layers to render');
    return `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#f8f9fa"/>
        <rect x="50" y="50" width="300" height="100" fill="#f5f5f5" stroke="#ddd" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="200" y="105" text-anchor="middle" font-size="14" fill="#666">Nessun layer disponibile</text>
      </svg>
    `;
  }

  console.log('[RDA Export] 🎨 Starting professional SVG generation for:', layers.length, 'layers');
  
  // Valida layers e materiali
  const validLayers = layers.filter(layer => {
    const hasMaterial = !!layer.material;
    const hasThickness = typeof layer.thickness === 'number' && layer.thickness > 0;
    
    if (!hasMaterial) {
      console.warn('[RDA Export] ⚠️ Layer missing material:', layer);
    }
    if (!hasThickness) {
      console.warn('[RDA Export] ⚠️ Layer missing/invalid thickness:', layer);
    }
    
    return hasMaterial && hasThickness;
  });

  if (validLayers.length === 0) {
    console.log('[RDA Export] ❌ No valid layers found');
    return `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#f8f9fa"/>
        <rect x="50" y="80" width="300" height="40" fill="#fef3c7" stroke="#d97706"/>
        <text x="200" y="105" text-anchor="middle" font-size="12" fill="#92400e">
          Dati layer non validi per la visualizzazione
        </text>
      </svg>
    `;
  }

  try {
    const correctedTotalThickness = calculateActualThickness(validLayers);
    const structuralGroups = identifyStructuralGroups(validLayers);
    
    console.log('[RDA Export] 📏 Thickness calculation:', {
      originalThickness: actualTotalThickness,
      correctedThickness: correctedTotalThickness,
      groupsCount: structuralGroups.length
    });
    
    // Calcola larghezza effettiva del disegno (escludendo accessori)
    const calculateEffectiveDrawingWidth = (scale: number) => {
      let totalWidth = 0;
      let groupCount = 0;
      
      structuralGroups.forEach((group) => {
        if (group.type === 'structural') {
          // Gruppo strutturale
          const structureThickness = group.structure ? getLayerActualThickness(group.structure) : 10;
          totalWidth += structureThickness * scale;
          groupCount++;
        } else {
          // Layer standalone - ESCLUDE GUIDE E ACCESSORI dalla visualizzazione
          const visibleLayers = group.layers.filter(layer => {
            return layer.material && !isGuide(layer.material) && !isAccessory(layer.material);
          });
          
          visibleLayers.forEach((layer) => {
            const actualThickness = getLayerActualThickness(layer);
            totalWidth += actualThickness * scale;
          });
          
          // Aggiungi spaziature tra layer standalone visibili (4px each)
          if (visibleLayers.length > 0) {
            totalWidth += (visibleLayers.length - 1) * 4;
            groupCount++;
          }
        }
      });
      
      // Aggiungi spaziature tra gruppi (8px each)
      if (groupCount > 1) {
        totalWidth += (groupCount - 1) * 8;
      }
      
      return totalWidth;
    };
    
    // Sistema di scaling adattivo - identico al componente UI
    const baseWidth = Math.max(correctedTotalThickness, 100);
    const scale = Math.min(8, Math.max(0.8, 320 / baseWidth));
    
    // Calcola larghezza effettiva del disegno (incluse spaziature, esclusi accessori)
    const effectiveDrawingWidth = calculateEffectiveDrawingWidth(scale);
    
    // SVG dinamico che si adatta al contenuto + margini
    const svgWidth = Math.max(500, effectiveDrawingWidth + 150);
    const svgHeight = 280;
    
    // Posizione di partenza centrata
    const startX = (svgWidth - effectiveDrawingWidth) / 2;

    console.log('[RDA Export] 🎨 PROFESSIONAL SVG PARAMETERS:', {
      layersCount: validLayers.length,
      correctedTotalThickness,
      baseWidth,
      scale: scale.toFixed(2),
      effectiveDrawingWidth: effectiveDrawingWidth.toFixed(1),
      svgWidth,
      startX: startX.toFixed(1),
      groupsCount: structuralGroups.length
    });

    // Genera definizioni per pattern di isolamento
    let svgDefinitions = '';
    const insulationLayers = validLayers.filter(layer => isInsulation(layer.material));
    insulationLayers.forEach((layer, index) => {
      const insulationColor = layer.material?.color_hex || '#FFFF99';
      const patternId = `insulation-pattern-${index}`;
      
      svgDefinitions += `
        <pattern id="${patternId}" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="${insulationColor}" opacity="0.4"/>
          <path d="M0,6 L6,0 M-1,1 L1,-1 M5,7 L7,5" stroke="${insulationColor}" stroke-width="0.8" opacity="0.9"/>
          <circle cx="3" cy="3" r="1" fill="${insulationColor}" opacity="0.6"/>
        </pattern>
      `;
    });

    // Genera rendering dei layer con design professionale
    let layerSVG = '';
    let currentX = startX;
    
    structuralGroups.forEach((group, groupIndex) => {
      if (group.type === 'structural') {
        // Render gruppo strutturale con effetti 3D
        const structureThickness = group.structure ? getLayerActualThickness(group.structure) : 10;
        const groupWidth = structureThickness * scale;
        const structureMaterial = group.structure?.material;
        const color = structureMaterial?.color_hex || '#CCCCCC';
        const hasGuides = group.guides.length > 0;
        
        // Struttura principale con effetto 3D
        layerSVG += `
          <rect x="${currentX}" y="90" width="${groupWidth}" height="100" fill="${color}" stroke="#374151" stroke-width="1" opacity="0.85"/>
          <polygon points="${currentX},90 ${currentX + 12},78 ${currentX + groupWidth + 12},78 ${currentX + groupWidth},90" 
                   fill="${color}" opacity="0.9" stroke="#374151" stroke-width="1"/>
          <polygon points="${currentX + groupWidth},90 ${currentX + groupWidth + 12},78 ${currentX + groupWidth + 12},178 ${currentX + groupWidth},190" 
                   fill="${color}" opacity="0.6" stroke="#374151" stroke-width="1"/>
        `;
        
        // Guide (se presenti)
        if (hasGuides) {
          layerSVG += `
            <rect x="${currentX - 6}" y="65" width="${groupWidth + 12}" height="10" fill="#8B5CF6" stroke="#6D28D9" stroke-width="1" opacity="0.9"/>
            <rect x="${currentX - 6}" y="200" width="${groupWidth + 12}" height="10" fill="#8B5CF6" stroke="#6D28D9" stroke-width="1" opacity="0.9"/>
            <text x="${currentX + groupWidth / 2}" y="72" text-anchor="middle" font-size="7" fill="#6D28D9" font-weight="600">GUIDA</text>
            <text x="${currentX + groupWidth / 2}" y="207" text-anchor="middle" font-size="7" fill="#6D28D9" font-weight="600">GUIDA</text>
          `;
        }
        
        // Nome materiale e spessore
        const materialName = structureMaterial?.name || 'Struttura';
        const maxChars = Math.floor(groupWidth / 9);
        layerSVG += `
          <text x="${currentX + groupWidth / 2}" y="130" text-anchor="middle" font-size="9" fill="#000000" font-weight="600">
            ${materialName.substring(0, maxChars)}
          </text>
          <text x="${currentX + groupWidth / 2}" y="155" text-anchor="middle" font-size="8" fill="#000000" font-weight="500">
            ${structureThickness}mm
          </text>
        `;
        
        // Isolamento interno con pattern
        group.internalInsulation.forEach((insulation, index) => {
          const insulationThickness = getLayerActualThickness(insulation);
          const insulationWidth = (insulationThickness / structureThickness) * groupWidth;
          const centeredX = currentX + (groupWidth - insulationWidth) / 2;
          const insulationMaterial = insulation.material;
          const insulationColor = insulationMaterial?.color_hex || '#FFFF99';
          const patternId = `insulation-pattern-${groupIndex}-${index}`;
          
          svgDefinitions += `
            <pattern id="${patternId}" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="${insulationColor}" opacity="0.4"/>
              <path d="M0,6 L6,0 M-1,1 L1,-1 M5,7 L7,5" stroke="${insulationColor}" stroke-width="0.8" opacity="0.9"/>
              <circle cx="3" cy="3" r="1" fill="${insulationColor}" opacity="0.6"/>
            </pattern>
          `;
          
          layerSVG += `
            <rect x="${centeredX}" y="100" width="${insulationWidth}" height="80" fill="${insulationColor}" opacity="0.4"/>
            <rect x="${centeredX}" y="100" width="${insulationWidth}" height="80" fill="url(#${patternId})"/>
          `;
        });
        
        currentX += groupWidth + 10; // Spacing tra gruppi aumentato
      } else {
        // Render layer standalone (escludendo guide e accessori)
        const visibleLayers = group.layers.filter(layer => {
          return layer.material && !isGuide(layer.material) && !isAccessory(layer.material);
        });
        
        visibleLayers.forEach((layer, layerIndex) => {
          const actualThickness = getLayerActualThickness(layer);
          const layerWidth = actualThickness * scale;
          const color = layer.material?.color_hex || '#CCCCCC';
          const materialName = layer.material?.name || 'N/A';
          const maxChars = Math.floor(layerWidth / 9);
          
          // Layer con effetto 3D
          layerSVG += `
            <rect x="${currentX}" y="90" width="${layerWidth}" height="100" fill="${color}" stroke="#374151" stroke-width="1" opacity="0.85"/>
            <polygon points="${currentX},90 ${currentX + 12},78 ${currentX + layerWidth + 12},78 ${currentX + layerWidth},90" 
                     fill="${color}" opacity="0.9" stroke="#374151" stroke-width="1"/>
            <polygon points="${currentX + layerWidth},90 ${currentX + layerWidth + 12},78 ${currentX + layerWidth + 12},178 ${currentX + layerWidth},190" 
                     fill="${color}" opacity="0.6" stroke="#374151" stroke-width="1"/>
          `;
          
          // Pattern speciale per isolanti
          if (isInsulation(layer.material)) {
            const patternId = `insulation-standalone-${groupIndex}-${layerIndex}`;
            svgDefinitions += `
              <pattern id="${patternId}" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="${color}" opacity="0.4"/>
                <path d="M0,6 L6,0 M-1,1 L1,-1 M5,7 L7,5" stroke="${color}" stroke-width="0.8" opacity="0.9"/>
                <circle cx="3" cy="3" r="1" fill="${color}" opacity="0.6"/>
              </pattern>
            `;
            
            layerSVG += `
              <rect x="${currentX}" y="100" width="${layerWidth}" height="80" fill="url(#${patternId})"/>
            `;
          }
          
          // Nome e spessore
          layerSVG += `
            <text x="${currentX + layerWidth / 2}" y="130" text-anchor="middle" font-size="9" fill="#000000" font-weight="600">
              ${materialName.substring(0, maxChars)}
            </text>
            <text x="${currentX + layerWidth / 2}" y="155" text-anchor="middle" font-size="8" fill="#000000" font-weight="500">
              ${actualThickness}mm
            </text>
          `;
          
          currentX += layerWidth + 6; // Spacing tra layer
        });
      }
    });

    // SVG finale con design professionale
    const finalSVG = `
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${svgDefinitions}
        </defs>
        
        <!-- Background professionale -->
        <rect width="${svgWidth}" height="${svgHeight}" fill="#f8f9fa" />
        <rect x="20" y="20" width="${svgWidth - 40}" height="${svgHeight - 40}" fill="white" stroke="#e5e7eb" stroke-width="1" rx="4"/>
        
        <!-- Rendering layer -->
        ${layerSVG}
        
        <!-- Quotatura totale con design migliorato -->
        <line x1="${startX}" y1="45" x2="${startX + effectiveDrawingWidth}" y2="45" stroke="#374151" stroke-width="2" />
        <line x1="${startX}" y1="35" x2="${startX}" y2="55" stroke="#374151" stroke-width="2" />
        <line x1="${startX + effectiveDrawingWidth}" y1="35" x2="${startX + effectiveDrawingWidth}" y2="55" stroke="#374151" stroke-width="2" />
        <text x="${startX + effectiveDrawingWidth / 2}" y="32" text-anchor="middle" font-size="14" fill="#1f2937" font-weight="700">
          SPESSORE TOTALE: ${correctedTotalThickness.toFixed(1)} mm
        </text>
        
        <!-- Info tecniche -->
        <text x="25" y="${svgHeight - 25}" font-size="9" fill="#6b7280">
          Scala: ${scale.toFixed(2)}x | Larghezza effettiva: ${effectiveDrawingWidth.toFixed(1)}px | Generato da RDA Completa
        </text>
        <text x="${svgWidth - 25}" y="${svgHeight - 25}" font-size="9" fill="#6b7280" text-anchor="end">
          ${new Date().toLocaleDateString('it-IT')}
        </text>
      </svg>
    `;

    console.log('[RDA Export] ✅ Professional SVG generated successfully');
    return finalSVG;
    
  } catch (error) {
    console.error('[RDA Export] ❌ Error in professional SVG generation:', error);
    
    // Fallback SVG robusto
    const fallbackThickness = actualTotalThickness || 100;
    return `
      <svg width="500" height="280" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="280" fill="#f8f9fa"/>
        <rect x="50" y="100" width="400" height="80" fill="#e5e7eb" stroke="#374151"/>
        <text x="250" y="135" text-anchor="middle" font-size="14" fill="#333">
          Stratigrafia - ${fallbackThickness.toFixed(1)}mm
        </text>
        <text x="250" y="155" text-anchor="middle" font-size="12" fill="#666">
          ${validLayers.length} layer
        </text>
      </svg>
    `;
  }
};

// Genera preview stratigrafia professionale
const generateStratigraphyPreview = (layers: any[], totalThickness: number): string => {
  try {
    console.log('[RDA Export] 🎨 Generating professional SVG preview for:', layers.length, 'layers');
    
    const svgString = generateProfessionalSVG(layers, totalThickness);
    
    // Encoding sicuro per PDF
    const cleanSvgString = svgString.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
    const base64SVG = btoa(unescape(encodeURIComponent(cleanSvgString)));
    
    console.log('[RDA Export] ✅ Professional SVG generated successfully');
    return "data:image/svg+xml;base64," + base64SVG;
    
  } catch (error) {
    console.error('[RDA Export] ❌ Error generating professional SVG:', error);
    
    // Fallback semplice
    const correctedTotalThickness = layers.length > 0 ? calculateActualThickness(layers) : totalThickness;
    const simpleFallback = `
      <svg width="500" height="280" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="280" fill="#f8f9fa"/>
        <rect x="50" y="100" width="400" height="80" fill="#e5e7eb" stroke="#374151"/>
        <text x="250" y="135" text-anchor="middle" font-size="14" fill="#333">
          Stratigrafia - ${correctedTotalThickness.toFixed(1)}mm
        </text>
      </svg>
    `;
    
    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(simpleFallback)));
  }
};

// Genera legenda materiali professionale per PDF
const generateMaterialLegend = (layers: any[]): MaterialLegendItem[] => {
  const legend: MaterialLegendItem[] = [];
  const processedMaterials = new Set<string>();
  
  layers.forEach(layer => {
    if (layer.material && !processedMaterials.has(layer.material.code)) {
      const cost = calculateLayerCost(layer);
      const installationTime = calculateLayerInstallationTime(layer);
      
      legend.push({
        name: layer.material.name || 'N/A',
        code: layer.material.code || 'N/A',
        category: layer.material.category || 'other',
        supplier: layer.material.supplier || 'N/A',
        color: layer.material.color_hex || '#CCCCCC',
        thickness: layer.thickness,
        cost: cost,
        installationTime: installationTime,
        specifications: [
          layer.material.fire_class && `Classe fuoco: ${layer.material.fire_class}`,
          layer.material.thermal_conductivity && `Conducibilità: ${layer.material.thermal_conductivity}`,
          layer.material.acoustic_performance && `Acustica: ${layer.material.acoustic_performance}dB`
        ].filter(Boolean).join(' | ') || undefined
      });
      
      processedMaterials.add(layer.material.code);
    }
    
    // Aggiungi viti integrate come elementi separati
    if (layer.screwMaterial && !processedMaterials.has(layer.screwMaterial.code)) {
      legend.push({
        name: layer.screwMaterial.name || 'Vite',
        code: layer.screwMaterial.code || 'N/A',
        category: 'screw',
        supplier: layer.screwMaterial.supplier || 'N/A',
        color: layer.screwMaterial.color_hex || '#888888',
        cost: layer.screwCostPerSqm || 0,
        installationTime: (layer.screwQuantity || 0) * 0.03,
        specifications: `Quantità: ${layer.screwQuantity || 0}/m² per ${layer.material?.name || 'layer'}`
      });
      
      processedMaterials.add(layer.screwMaterial.code);
    }
  });
  
  // Ordina per categoria: strutturali prima, accessori dopo
  return legend.sort((a, b) => {
    const aStructural = isStructuralMaterial(a.category);
    const bStructural = isStructuralMaterial(b.category);
    
    if (aStructural && !bStructural) return -1;
    if (!aStructural && bStructural) return 1;
    return a.category.localeCompare(b.category);
  });
};

// Estrai materiali dettagliati da stratigrafia
const extractDetailedMaterials = (layers: any[]): StratigraphyMaterial[] => {
  const materials: StratigraphyMaterial[] = [];
  
  layers.forEach(layer => {
    if (layer.material) {
      const cost = calculateLayerCost(layer);
      const installationTime = calculateLayerInstallationTime(layer);
      
      materials.push({
        materialName: layer.material.name || 'Materiale sconosciuto',
        materialCode: layer.material.code || 'N/A',
        category: layer.material.category || 'other',
        supplier: layer.material.supplier || 'Non specificato',
        thickness: layer.thickness || 0,
        quantity: layer.material.incidence_per_sqm || 1,
        unitPrice: layer.material.unit_price || 0,
        totalCost: cost,
        unit: layer.material.unit || 'm²',
        specifications: [
          layer.material.fire_class && `Classe fuoco: ${layer.material.fire_class}`,
          layer.material.thermal_conductivity && `λ = ${layer.material.thermal_conductivity} W/mK`,
          layer.material.acoustic_performance && `ΔRw = ${layer.material.acoustic_performance} dB`,
          layer.material.density && `Densità: ${layer.material.density} kg/m³`
        ].filter(Boolean).join(' | ') || undefined,
        installationTime
      });
      
      // Aggiungi viti integrate come materiali separati
      if (layer.screwMaterial && layer.screwQuantity) {
        materials.push({
          materialName: `${layer.screwMaterial.name} (per ${layer.material.name})`,
          materialCode: layer.screwMaterial.code || 'N/A',
          category: 'screw',
          supplier: layer.screwMaterial.supplier || 'Non specificato',
          thickness: 0,
          quantity: layer.screwQuantity,
          unitPrice: layer.screwMaterial.unit_price || 0,
          totalCost: layer.screwCostPerSqm || 0,
          unit: 'pz/m²',
          specifications: `Quantità: ${layer.screwQuantity} pezzi per m²`,
          installationTime: layer.screwQuantity * 0.03
        });
      }
    }
  });
  
  return materials;
};

export const exportCompleteRDA = async (
  estimate: Estimate,
  stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[]
) => {
  console.log('[RDA Export] 🚀 Starting COMPLETE RDA export for:', estimate.name);
  console.log('[RDA Export] 📊 Processing', stratigraphies.length, 'stratigraphies');

  const doc = new jsPDF();
  
  // Fetch project information
  let projectInfo: ProjectInfo = { name: 'N/A', client: 'N/A', description: '' };
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('name, client, description')
      .eq('id', estimate.projectId)
      .single();
    
    if (project) {
      projectInfo = project;
    }
  } catch (error) {
    console.warn('[RDA Export] ⚠️ Could not fetch project info:', error);
  }

  let currentY = 20;

  // ========== PAGINA DI COPERTINA PROFESSIONALE ==========
  // Header principale
  doc.setFillColor(57, 99, 175);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('RDA COMPLETA', 105, 22, { align: 'center' });
  doc.setFontSize(14);
  doc.text('RICHIESTA DI ACQUISTO DETTAGLIATA', 105, 30, { align: 'center' });

  // Informazioni progetto e preventivo
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.text('INFORMAZIONI GENERALI', 20, 55);
  
  doc.setFontSize(12);
  doc.text(`PROGETTO: ${projectInfo.name}`, 20, 70);
  doc.text(`CLIENTE: ${projectInfo.client}`, 20, 80);
  doc.text(`PREVENTIVO: ${estimate.name}`, 20, 90);
  doc.text(`DATA: ${new Date().toLocaleDateString('it-IT')}`, 20, 100);
  
  if (projectInfo.description) {
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(projectInfo.description, 170);
    doc.text(`Descrizione: ${descLines.join(' ')}`, 20, 115);
  }

  // Statistiche generali
  doc.setFontSize(14);
  doc.setTextColor(57, 99, 175);
  doc.text('RIEPILOGO ESECUTIVO', 20, 140);
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.text(`• Numero stratigrafie: ${stratigraphies.length}`, 25, 155);
  
  // Calcola totali
  let totalMaterialCost = 0;
  let totalLayers = 0;
  let totalAccessories = 0;
  
  stratigraphies.forEach(stratigraphy => {
    const layers = getLayersFromStratigraphy(stratigraphy);
    totalLayers += layers.length;
    
    layers.forEach(layer => {
      if (layer.material) {
        const cost = calculateLayerCost(layer);
        totalMaterialCost += cost * (stratigraphy.area || 1);
        
        if (isAccessory(layer.material) || layer.material.category === 'screw') {
          totalAccessories++;
        }
      }
    });
  });
  
  doc.text(`• Totale layer: ${totalLayers}`, 25, 165);
  doc.text(`• Materiali accessori: ${totalAccessories}`, 25, 175);
  doc.text(`• Costo materiali stimato: €${totalMaterialCost.toFixed(2)}`, 25, 185);

  // Footer copertina
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Documento generato automaticamente dal sistema RDA Completa', 105, 280, { align: 'center' });

  // ========== TABELLA RIEPILOGO GENERALE ==========
  doc.addPage();
  currentY = 20;
  
  // Header pagina riepilogo
  doc.setFillColor(57, 99, 175);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('RIEPILOGO MATERIALI PER STRATIGRAFIE', 105, 16, { align: 'center' });

  currentY = 35;

  // Tabella riepilogo generale
  const summaryData: any[] = [];
  stratigraphies.forEach(stratigraphy => {
    const layers = getLayersFromStratigraphy(stratigraphy);
    const materials = extractDetailedMaterials(layers);
    
    let totalStratigraphyCost = 0;
    let totalTime = 0;
    
    materials.forEach(material => {
      totalStratigraphyCost += material.totalCost;
      totalTime += material.installationTime || 0;
    });
    
    summaryData.push([
      stratigraphy.name,
      `${materials.length}`,
      `${(stratigraphy.area || 1).toFixed(1)} m²`,
      `€${totalStratigraphyCost.toFixed(2)}/m²`,
      `€${(totalStratigraphyCost * (stratigraphy.area || 1)).toFixed(2)}`,
      `${totalTime.toFixed(1)} min/m²`
    ]);
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Stratigrafia', 'Materiali', 'Area', 'Costo/m²', 'Costo Totale', 'Tempo/m²']],
    body: summaryData,
    theme: 'striped',
    headStyles: { 
      fillColor: [57, 99, 175],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    }
  });

  // ========== ABACO DETTAGLIATO DELLE STRATIGRAFIE ==========
  stratigraphies.forEach((stratigraphy, index) => {
    console.log(`[RDA Export] 📋 Processing stratigraphy ${index + 1}/${stratigraphies.length}: ${stratigraphy.name}`);
    
    const layers = getLayersFromStratigraphy(stratigraphy);
    if (layers.length === 0) {
      console.warn(`[RDA Export] ⚠️ No layers found for stratigraphy: ${stratigraphy.name}`);
      return;
    }

    // Nuova pagina per ogni stratigrafia
    doc.addPage();
    currentY = 20;

    // Header stratigrafia
    doc.setFillColor(57, 99, 175);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`STRATIGRAFIA ${index + 1}: ${stratigraphy.name}`, 105, 20, { align: 'center' });

    // Informazioni stratigrafia
    currentY = 40;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(11);
    
    const correctedThickness = calculateActualThickness(layers);
    doc.text(`Spessore totale: ${correctedThickness.toFixed(1)} mm`, 20, currentY);
    doc.text(`Area: ${(stratigraphy.area || 1).toFixed(1)} m²`, 120, currentY);
    
    currentY += 10;
    doc.text(`Quantità: ${stratigraphy.quantity || 1}`, 20, currentY);
    doc.text(`Livello finitura: ${(stratigraphy as any).finishLevel || 'Standard'}`, 120, currentY);

    // Disegno schematico professionale
    currentY += 20;
    try {
      const svgPreview = generateStratigraphyPreview(layers, correctedThickness);
      const imgWidth = 170;
      const imgHeight = 50;
      
      doc.addImage(svgPreview, 'SVG', 20, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 15;
      
      console.log(`[RDA Export] ✅ Professional SVG added for: ${stratigraphy.name}`);
    } catch (error) {
      console.error(`[RDA Export] ❌ Error adding SVG for ${stratigraphy.name}:`, error);
      
      // Fallback rettangolo
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY, 170, 50, 'F');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(12);
      doc.text('Visualizzazione stratigrafia non disponibile', 105, currentY + 30, { align: 'center' });
      currentY += 65;
    }

    // Legenda materiali professionale
    const legend = generateMaterialLegend(layers);
    if (legend.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(57, 99, 175);
      doc.text('LEGENDA MATERIALI', 20, currentY);
      currentY += 10;
      
      // Materiali strutturali
      const structuralMaterials = legend.filter(item => isStructuralMaterial(item.category));
      if (structuralMaterials.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('🏗️ MATERIALI STRUTTURALI:', 25, currentY);
        currentY += 7;
        
        structuralMaterials.forEach(material => {
          doc.setFontSize(9);
          const emoji = getCategoryEmoji(material.category);
          doc.text(`${emoji} ${material.name} (${material.code})`, 30, currentY);
          doc.text(`€${material.cost.toFixed(2)}/m²`, 160, currentY);
          currentY += 5;
          
          if (material.specifications) {
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(8);
            const specLines = doc.splitTextToSize(material.specifications, 150);
            specLines.forEach(line => {
              doc.text(line, 35, currentY);
              currentY += 4;
            });
            doc.setTextColor(80, 80, 80);
          }
          currentY += 2;
        });
      }
      
      // Accessori e finiture
      const accessoryMaterials = legend.filter(item => !isStructuralMaterial(item.category));
      if (accessoryMaterials.length > 0) {
        currentY += 5;
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('🔧 ACCESSORI E FINITURE:', 25, currentY);
        currentY += 7;
        
        accessoryMaterials.forEach(material => {
          doc.setFontSize(9);
          const emoji = getCategoryEmoji(material.category);
          doc.text(`${emoji} ${material.name} (${material.code})`, 30, currentY);
          doc.text(`€${material.cost.toFixed(2)}/m²`, 160, currentY);
          currentY += 5;
          
          if (material.specifications) {
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(8);
            const specLines = doc.splitTextToSize(material.specifications, 150);
            specLines.forEach(line => {
              doc.text(line, 35, currentY);
              currentY += 4;
            });
            doc.setTextColor(80, 80, 80);
          }
          currentY += 2;
        });
      }
    }

    // Tabella dettagliata materiali
    const materials = extractDetailedMaterials(layers);
    if (materials.length > 0) {
      // Controlla se serve una nuova pagina
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }
      
      currentY += 10;
      doc.setFontSize(12);
      doc.setTextColor(57, 99, 175);
      doc.text('DETTAGLIO MATERIALI', 20, currentY);
      currentY += 10;

      const materialsTableData = materials.map(material => [
        material.materialName,
        material.materialCode,
        material.supplier,
        material.category,
        material.thickness > 0 ? `${material.thickness}mm` : '-',
        `${material.quantity}`,
        material.unit,
        `€${material.unitPrice.toFixed(2)}`,
        `€${material.totalCost.toFixed(2)}`,
        `${(material.installationTime || 0).toFixed(1)} min`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Materiale', 'Codice', 'Fornitore', 'Categoria', 'Spess.', 'Qtà', 'Unità', 'Prezzo', 'Costo/m²', 'Tempo']],
        body: materialsTableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [57, 99, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 12, halign: 'center' },
          6: { cellWidth: 12, halign: 'center' },
          7: { cellWidth: 18, halign: 'right' },
          8: { cellWidth: 20, halign: 'right' },
          9: { cellWidth: 18, halign: 'right' }
        }
      });
    }

    // Totali stratigrafia
    const lastTableY = (doc as any).lastAutoTable?.finalY || currentY;
    currentY = lastTableY + 15;
    
    const totalCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
    const totalTime = materials.reduce((sum, material) => sum + (material.installationTime || 0), 0);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(20, currentY - 5, 170, 25, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`TOTALE STRATIGRAFIA: €${totalCost.toFixed(2)}/m²`, 25, currentY + 5);
    doc.text(`TEMPO INSTALLAZIONE: ${totalTime.toFixed(1)} min/m²`, 25, currentY + 15);
    doc.text(`COSTO TOTALE AREA: €${(totalCost * (stratigraphy.area || 1)).toFixed(2)}`, 120, currentY + 5);
    doc.text(`TEMPO TOTALE AREA: ${((totalTime * (stratigraphy.area || 1)) / 60).toFixed(1)} ore`, 120, currentY + 15);

    console.log(`[RDA Export] ✅ Completed stratigraphy ${index + 1}: ${stratigraphy.name}`);
  });

  // ========== PAGINA FINALE CON RIEPILOGO TOTALE ==========
  doc.addPage();
  
  // Header finale
  doc.setFillColor(57, 99, 175);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('RIEPILOGO FINALE RDA COMPLETA', 105, 16, { align: 'center' });

  currentY = 40;
  
  // Calcoli finali
  let grandTotalCost = 0;
  let grandTotalArea = 0;
  let grandTotalTime = 0;
  
  stratigraphies.forEach(stratigraphy => {
    const layers = getLayersFromStratigraphy(stratigraphy);
    const materials = extractDetailedMaterials(layers);
    const stratCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
    const stratTime = materials.reduce((sum, material) => sum + (material.installationTime || 0), 0);
    const stratArea = stratigraphy.area || 1;
    
    grandTotalCost += stratCost * stratArea;
    grandTotalArea += stratArea;
    grandTotalTime += stratTime * stratArea;
  });

  doc.setFontSize(14);
  doc.setTextColor(57, 99, 175);
  doc.text('TOTALI GENERALI', 20, currentY);
  
  currentY += 20;
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Area totale progetto: ${grandTotalArea.toFixed(1)} m²`, 20, currentY);
  currentY += 15;
  doc.text(`Costo totale materiali: €${grandTotalCost.toFixed(2)}`, 20, currentY);
  currentY += 15;
  doc.text(`Tempo totale installazione: ${(grandTotalTime / 60).toFixed(1)} ore`, 20, currentY);
  currentY += 15;
  doc.text(`Costo medio per m²: €${(grandTotalCost / grandTotalArea).toFixed(2)}/m²`, 20, currentY);

  // Note finali
  currentY += 30;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Note:', 20, currentY);
  currentY += 10;
  doc.text('• I prezzi sono espressi al netto di IVA', 25, currentY);
  currentY += 8;
  doc.text('• I tempi di installazione sono indicativi e possono variare', 25, currentY);
  currentY += 8;
  doc.text('• Verificare disponibilità materiali prima dell\'ordine', 25, currentY);

  // Footer finale
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Documento generato il ${new Date().toLocaleString('it-IT')}`, 105, 280, { align: 'center' });

  // Salva il documento
  const fileName = `RDA_Completa_${estimate.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  console.log('[RDA Export] 🎉 COMPLETE RDA export completed successfully!');
};