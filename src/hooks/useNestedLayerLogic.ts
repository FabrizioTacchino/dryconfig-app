// This hook is deprecated - using integrated system instead
// Keeping only as a stub to prevent build errors

export const useNestedLayerLogic = () => {
  console.warn('[useNestedLayerLogic] DEPRECATED: Use integrated system instead');
  
  return {
    boardLayers: [],
    screwLayers: [],
    handleAddBoard: () => {},
    handleRemoveBoard: () => {},
    handleDuplicateBoard: () => {},
    handleBoardChange: () => {},
    handleAddScrew: () => {},
    handleRemoveScrew: () => {},
    handleScrewChange: () => {},
    dragHandlers: {
      handleDragStart: () => {},
      handleDragOver: () => {},
      handleDragLeave: () => {},
      handleDrop: () => {}
    }
  };
};
