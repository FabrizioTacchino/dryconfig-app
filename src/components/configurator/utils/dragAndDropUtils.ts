
export interface DragState {
  draggedLayer: string | null;
  dragOverIndex: number | null;
}

export const createDragHandlers = (
  layers: any[],
  onLayersChange: (layers: any[]) => void,
  setDraggedLayer: (id: string | null) => void,
  setDragOverIndex: (index: number | null) => void
) => {
  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, draggedLayer: string | null) => {
    e.preventDefault();
    
    if (!draggedLayer) return;

    const draggedLayerObj = layers.find(l => l.id === draggedLayer);
    if (!draggedLayerObj) return;

    const newLayers = [...layers];
    const otherLayers = newLayers.filter(l => l.id !== draggedLayer);
    
    // Riorganizza le posizioni
    const reorderedLayers = [
      ...otherLayers.slice(0, dropIndex),
      draggedLayerObj,
      ...otherLayers.slice(dropIndex)
    ].map((layer, index) => ({
      ...layer,
      position: index + 1
    }));

    onLayersChange(reorderedLayers);
    setDraggedLayer(null);
    setDragOverIndex(null);
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
