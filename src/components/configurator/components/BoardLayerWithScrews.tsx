import React from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { Layer } from '../types/StratigraphyTypes';

// This component is deprecated - use IntegratedBoardLayerItem instead
// Keeping only as a stub to prevent build errors

interface BoardLayerWithScrewsProps {
  boardLayer: Layer;
  associatedScrews: Layer[];
  availableMaterials: DatabaseMaterial[];
  onBoardChange: (layerId: string, updates: Partial<Layer>) => void;
  onScrewChange: (screwId: string, updates: Partial<Layer>) => void;
  onAddScrew: (boardLayerId: string) => void;
  onRemoveScrew: (screwId: string) => void;
  onRemoveBoard: (boardId: string) => void;
  onDuplicateBoard: (boardId: string) => void;
  isDragged?: boolean;
  isDraggedOver?: boolean;
  onDragStart?: (e: React.DragEvent, layerId: string) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, dropIndex: number) => void;
  index: number;
}

const BoardLayerWithScrews = (props: BoardLayerWithScrewsProps) => {
  console.warn('[BoardLayerWithScrews] DEPRECATED: Use IntegratedBoardLayerItem instead');
  
  return (
    <div className="p-4 border rounded bg-yellow-50 border-yellow-200">
      <p className="text-yellow-800 text-sm">
        ⚠️ Componente deprecato. Utilizza IntegratedBoardLayerItem invece.
      </p>
    </div>
  );
};

export default BoardLayerWithScrews;
