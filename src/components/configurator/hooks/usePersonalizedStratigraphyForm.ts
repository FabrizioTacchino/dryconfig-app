
import { useState, useEffect } from 'react';
import { WallType } from '@/types';
import { determineWallType } from '../utils/wallTypeDetection';

interface PersonalizedStratigraphyFormData {
  name: string;
  description: string;
  type: WallType;
  finishLevel?: string;
  selectedSupplier?: string;
}

interface UsePersonalizedStratigraphyFormProps {
  layers: any[];
  editingStratigraphy?: any;
}

export const usePersonalizedStratigraphyForm = ({ 
  layers, 
  editingStratigraphy 
}: UsePersonalizedStratigraphyFormProps) => {
  const [formData, setFormData] = useState<PersonalizedStratigraphyFormData>({
    name: '',
    description: '',
    type: 'internal' as WallType,
    finishLevel: 'Q1',
    selectedSupplier: 'all'
  });

  // Initialize form data from editing stratigraphy
  useEffect(() => {
    if (editingStratigraphy) {
      const stratigraphyData = editingStratigraphy.stratigraphy || editingStratigraphy;
      
      console.log('[usePersonalizedStratigraphyForm] 🔄 INITIALIZING FORM DATA:', {
        name: stratigraphyData.name,
        description: stratigraphyData.description,
        type: stratigraphyData.type,
        finishLevel: stratigraphyData.finish_level || stratigraphyData.finishLevel
      });

      setFormData({
        name: stratigraphyData.name || '',
        description: stratigraphyData.description || '',
        type: stratigraphyData.type || 'internal',
        finishLevel: stratigraphyData.finish_level || stratigraphyData.finishLevel || 'Q1',
        selectedSupplier: 'all'
      });
    }
  }, [editingStratigraphy]);

  // Auto-detect wall type based on layers composition
  useEffect(() => {
    if (layers.length === 0 || editingStratigraphy) return;

    const detectedType = determineWallType(layers);

    console.log('[usePersonalizedStratigraphyForm] 🔄 AUTO-DETECTED TYPE:', {
      layersCount: layers.length,
      detectedType
    });

    setFormData(prev => ({ ...prev, type: detectedType }));
  }, [layers, editingStratigraphy]);

  const handleFormChange = (field: keyof PersonalizedStratigraphyFormData, value: any) => {
    console.log('[usePersonalizedStratigraphyForm] 📝 FORM CHANGE:', { field, value });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    console.log('[usePersonalizedStratigraphyForm] 🔄 RESETTING FORM');
    setFormData({
      name: '',
      description: '',
      type: 'internal',
      finishLevel: 'Q1',
      selectedSupplier: 'all'
    });
  };

  return {
    formData,
    handleFormChange,
    resetForm
  };
};
