// This hook is deprecated - using useIntegratedScrewSelection instead
// Keeping only as a stub to prevent build errors

export const useAutomaticScrewSelection = () => {
  console.warn('[useAutomaticScrewSelection] DEPRECATED: Use useIntegratedScrewSelection instead');
  
  return {
    selectedScrews: {},
    handleScrewSelection: () => {},
    clearScrewSelection: () => {},
    hasSelectedScrews: false
  };
};
