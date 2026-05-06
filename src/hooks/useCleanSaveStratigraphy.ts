// This hook is deprecated - using useIntegratedStratigraphySave instead
// Keeping only as a stub to prevent build errors

export const useCleanSaveStratigraphy = () => {
  console.warn('[useCleanSaveStratigraphy] DEPRECATED: Use useIntegratedStratigraphySave instead');
  
  return {
    mutate: () => {},
    isPending: false
  };
};
