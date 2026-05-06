
import React from 'react';
import { MaterialCategory } from '@/types';
import CertificationGeneralForm from './CertificationGeneralForm';
import CertificationSupplierForm from './CertificationSupplierForm';
import CertificationFireForm from './CertificationFireForm';
import CertificationAcousticForm from './CertificationAcousticForm';
import CertificationCurvatureForm from './CertificationCurvatureForm';
import CertificationBreakResistanceForm from './CertificationBreakResistanceForm';
import SharedCalculatedFieldsCard from './SharedCalculatedFieldsCard';
import { calculateTotalThicknessExcludingGuides } from '../utils/stratigraphyUtils';
import { useStratigraphyCalculations } from '../hooks/useStratigraphyCalculations';
import { useMaterials } from '@/hooks/useMaterials';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
  screwMaterialId?: string;
  screwMaterial?: any;
  screwQuantity?: number;
  screwCostPerSqm?: number;
}

interface CertifiedStratigraphyFormSectionsProps {
  formData: any; // Using PersonalizedStratigraphyForm data structure
  onFormChange: (field: string, value: any) => void;
  layers: Layer[];
  finishLevels?: {
    finish_level: string;
  }[];
}

const CertifiedStratigraphyFormSections = ({
  formData,
  onFormChange,
  layers,
  finishLevels = []
}: CertifiedStratigraphyFormSectionsProps) => {
  // Fetch all materials
  const { data: allMaterials = [] } = useMaterials();

  // Calculate values for the shared component
  const totalThickness = calculateTotalThicknessExcludingGuides(layers);
  const structureWidth = React.useMemo(() => {
    const structureLayers = layers.filter(layer => layer.category === 'structure_frame');
    let maxWidth = 0;
    structureLayers.forEach(layer => {
      if (layer.material) {
        let width = layer.material.width || layer.material.larghezza || layer.material.dimension || layer.material.size;
        if (!width && layer.material.description) {
          // Extract width from description if needed
          const dimensionPatterns = [
            /Dimensione:\s*(\d+)x(\d+)x(\d+)/i,
            /Dimensioni:\s*(\d+)x(\d+)x(\d+)/i,
            /(\d+)x(\d+)x(\d+)\s*mm/i,
            /(\d+)x(\d+)x(\d+)/i
          ];
          
          for (const pattern of dimensionPatterns) {
            const match = layer.material.description.match(pattern);
            if (match) {
              width = parseInt(match[2]);
              break;
            }
          }
        }
        if (width && width > maxWidth) {
          maxWidth = width;
        }
      }
    });
    return maxWidth;
  }, [layers]);

  // Use the shared calculation hook for consistency
  const { calculateCost, calculateWeight } = useStratigraphyCalculations({ layers });
  const estimatedCost = calculateCost();
  const weightPerSqm = calculateWeight();
  
  // Calculate valid layers count
  const layersCount = layers.filter(layer => layer.material && layer.thickness > 0).length;

  // 🔥 CREATE EXTENDED FORM DATA FOR CERTIFICATION FIELDS
  const certificationFormData = {
    ...formData,
    // Map personalized form fields to certification fields
    fire_resistance: formData.fire_resistance || '',
    solution_number: formData.solution_number || '',
    materials: formData.materials || []
  };

  const handleCertificationFormChange = (field: string, value: any) => {
    onFormChange(field, value);
  };

  return (
    <>
      {/* General Section */}
      <CertificationGeneralForm 
        formData={certificationFormData} 
        onFormChange={handleCertificationFormChange} 
      />

      {/* Supplier Data Section */}
      <CertificationSupplierForm 
        formData={certificationFormData} 
        onFormChange={handleCertificationFormChange} 
      />

      {/* Fire Resistance Section */}
      <CertificationFireForm 
        formData={certificationFormData} 
        onFormChange={handleCertificationFormChange} 
      />

      {/* Acoustic Section */}
      <CertificationAcousticForm 
        formData={certificationFormData} 
        onFormChange={handleCertificationFormChange} 
      />

      {/* Curvature Section */}
      <CertificationCurvatureForm 
        formData={certificationFormData} 
        onFormChange={handleCertificationFormChange} 
      />

      {/* Break Resistance Section */}
      <CertificationBreakResistanceForm 
        formData={certificationFormData} 
        onFormChange={handleCertificationFormChange} 
      />

      {/* Automatically Calculated Fields */}
      <SharedCalculatedFieldsCard 
        totalThickness={totalThickness}
        structureWidth={structureWidth}
        layersCount={layersCount}
        estimatedCost={estimatedCost}
        weightPerSqm={weightPerSqm}
        layers={layers}
        materials={allMaterials}
      />
    </>
  );
};

export default CertifiedStratigraphyFormSections;
