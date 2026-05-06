// This hook is deprecated - using useIntegratedStratigraphySave instead
// Keeping only as a stub to prevent build errors

export const useSaveStratigraphy = () => {
  console.warn('[useSaveStratigraphy] DEPRECATED: Use useIntegratedStratigraphySave instead');
  
  return {
    mutate: () => {},
    isPending: false
  };
};
