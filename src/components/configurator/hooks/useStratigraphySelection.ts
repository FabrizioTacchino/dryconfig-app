
import { useState, useEffect } from 'react';

interface UseStratigraphySelectionProps {
  editingStratigraphy?: any;
  initialStratigraphyId?: string | null;
  stratigraphies: any[];
}

export const useStratigraphySelection = ({
  editingStratigraphy,
  initialStratigraphyId,
  stratigraphies
}: UseStratigraphySelectionProps) => {
  const [selectedStratigraphy, setSelectedStratigraphy] = useState<string>('');

  // Initialize selected stratigraphy from editing or initial parameter
  useEffect(() => {
    if (editingStratigraphy?.stratigraphyId) {
      setSelectedStratigraphy(editingStratigraphy.stratigraphyId);
    } else if (initialStratigraphyId && stratigraphies.length > 0) {
      const found = stratigraphies.find(s => s.id === initialStratigraphyId);
      if (found) {
        setSelectedStratigraphy(initialStratigraphyId);
      }
    }
  }, [editingStratigraphy, initialStratigraphyId, stratigraphies]);

  const selectedStratigraphyData = stratigraphies.find(s => s.id === selectedStratigraphy);

  return {
    selectedStratigraphy,
    setSelectedStratigraphy,
    selectedStratigraphyData
  };
};
