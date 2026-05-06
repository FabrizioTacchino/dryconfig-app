
import { useMemo } from 'react';
import { useMaterials } from './useMaterials';

export const useMaterialLookup = () => {
  const { data: allMaterials = [] } = useMaterials();

  const findMaterialByDescription = useMemo(() => {
    return (description: string, category?: string) => {
      // First try exact name match
      let material = allMaterials.find(m => 
        m.name.toLowerCase() === description.toLowerCase()
      );

      // If not found, try partial match
      if (!material) {
        material = allMaterials.find(m => 
          m.name.toLowerCase().includes(description.toLowerCase()) ||
          description.toLowerCase().includes(m.name.toLowerCase())
        );
      }

      // If still not found and category is provided, find first material of that category
      if (!material && category) {
        material = allMaterials.find(m => m.category === category);
      }

      // Last resort: find any material with similar characteristics
      if (!material) {
        material = allMaterials.find(m => 
          m.description?.toLowerCase().includes(description.toLowerCase()) ||
          description.toLowerCase().includes(m.description?.toLowerCase() || '')
        );
      }

      return material;
    };
  }, [allMaterials]);

  const findMaterialByCode = useMemo(() => {
    return (code: string) => {
      return allMaterials.find(m => m.code === code);
    };
  }, [allMaterials]);

  return {
    findMaterialByDescription,
    findMaterialByCode,
    allMaterials
  };
};
