
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { Layer } from '../types/StratigraphyTypes';
import { WallType } from '@/types';

// Funzione per determinare se un materiale è una lastra
export const isBoard = (material?: DatabaseMaterial) => {
  return material?.category === 'board';
};

// Funzione per determinare se un materiale è struttura (solo montanti)
export const isStructure = (material?: DatabaseMaterial) => {
  return material?.category === 'structure_frame';
};

// Funzione per contare le strutture nei layer
export const countStructures = (layers: Layer[]) => {
  return layers.filter(layer => isStructure(layer.material)).length;
};

// Funzione per contare le lastre nei layer
export const countBoards = (layers: Layer[]) => {
  return layers.filter(layer => isBoard(layer.material)).length;
};

// Funzione per analizzare la posizione delle lastre rispetto alle strutture
export const analyzeBoardPositions = (layers: Layer[]) => {
  const sortedLayers = [...layers].sort((a, b) => a.position - b.position);
  const structurePositions = sortedLayers
    .map((layer, index) => ({ layer, index }))
    .filter(({ layer }) => isStructure(layer.material))
    .map(({ index }) => index);

  if (structurePositions.length === 0) {
    return { leftBoards: 0, rightBoards: 0, totalBoards: countBoards(layers) };
  }

  // Per semplicità, consideriamo la prima struttura come riferimento
  const firstStructureIndex = structurePositions[0];
  
  const leftBoards = sortedLayers
    .slice(0, firstStructureIndex)
    .filter(layer => isBoard(layer.material)).length;
    
  const rightBoards = sortedLayers
    .slice(firstStructureIndex + 1)
    .filter(layer => isBoard(layer.material)).length;

  return { leftBoards, rightBoards, totalBoards: leftBoards + rightBoards };
};

// Funzione principale per determinare automaticamente il tipo di parete
export const determineWallType = (layers: Layer[]): WallType => {
  const validLayers = layers.filter(layer => layer.materialId && layer.material);
  
  if (validLayers.length === 0) {
    return 'single'; // Default
  }

  const structureCount = countStructures(validLayers);
  const boardCount = countBoards(validLayers);
  const { leftBoards, rightBoards } = analyzeBoardPositions(validLayers);

  // Placcatura: 0 strutture, ≥1 lastra totale
  if (structureCount === 0 && boardCount >= 1) {
    return 'plating';
  }

  // Controparete: 1 struttura, lastre solo su un lato (1-3 lastre)
  if (structureCount === 1) {
    const hasOnlyOneSide = (leftBoards > 0 && rightBoards === 0) || (leftBoards === 0 && rightBoards > 0);
    const boardsInRange = (leftBoards >= 1 && leftBoards <= 3) || (rightBoards >= 1 && rightBoards <= 3);
    
    if (hasOnlyOneSide && boardsInRange) {
      return 'counterwall';
    }
    
    // Parete Singola: 1 struttura, lastre su entrambi i lati (1-3 per lato)
    if (leftBoards >= 1 && leftBoards <= 3 && rightBoards >= 1 && rightBoards <= 3) {
      return 'single';
    }
  }

  // Parete Doppia: ≥2 strutture distinte, con possibili lastre per ciascuna
  if (structureCount >= 2) {
    return 'double';
  }

  // Default: parete singola
  return 'single';
};

// Funzione per ottenere la descrizione del tipo di parete in italiano
export const getWallTypeDescription = (wallType: WallType): string => {
  const descriptions: Record<WallType, string> = {
    plating: 'Placcatura (solo lastre)',
    counterwall: 'Controparete (1 struttura, lastre su un lato)',
    single: 'Parete singola (1 struttura, lastre su entrambi i lati)',
    double: 'Parete doppia (2+ strutture)',
    ceiling: 'Controsoffitto',
    internal: 'Parete interna',
    external: 'Parete esterna',
    roof: 'Copertura',
    foundation: 'Fondazione',
  };
  
  return descriptions[wallType];
};

// Funzione per ottenere il nome italiano del tipo di parete
export const getWallTypeLabel = (wallType: WallType): string => {
  const labels: Record<WallType, string> = {
    plating: 'Placcatura',
    counterwall: 'Controparete',
    single: 'Parete Singola',
    double: 'Parete Doppia',
    ceiling: 'Controsoffitto',
    internal: 'Parete Interna',
    external: 'Parete Esterna',
    roof: 'Copertura',
    foundation: 'Fondazione',
  };
  
  return labels[wallType];
};
