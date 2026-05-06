
import { useState, useEffect } from 'react';
import { CertifiedStratigraphyFormData } from '@/types/certification';
import { determineWallType } from '../utils/wallTypeDetection';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: any;
  interAxis?: number;
}

// 🔥 EXTENDED FORM DATA WITH ALL CERTIFICATION FIELDS
interface ExtendedCertifiedFormData {
  // Base personalized fields
  name: string;
  description: string;
  type: 'single' | 'double' | 'plating' | 'counterwall' | 'ceiling';
  finishLevel: string;
  selectedSupplier: string;
  // Required certification fields (from CertifiedStratigraphyFormData)
  fire_resistance: string;
  solution_number: string;
  materials: any[];
  // Optional certification fields
  max_height?: number;
  acoustic_reduction?: number;
  acoustic_report_code?: string;
  solution_code?: string;
  extension_code?: string;
  supplier_name?: string;
  wall_thickness?: number;
  structure_width?: number;
  fire_test_report_code?: string;
  catalog_page?: string;
  curvature_radius?: number;
  curvature_radius_description?: string;
  break_resistance?: string;
  break_resistance_report_code?: string;
  break_resistance_notes?: string;
}

// Map WallType to CertifiedStratigraphyFormData type
const mapWallTypeToCertified = (wallType: string): ExtendedCertifiedFormData['type'] => {
  switch (wallType) {
    case 'plating':
      return 'plating';
    case 'counterwall':
      return 'counterwall';
    case 'single':
      return 'single';
    case 'double':
      return 'double';
    case 'ceiling':
      return 'ceiling';
    default:
      return 'single';
  }
};

export const useCertifiedStratigraphyForm = (layers: Layer[], editingStratigraphy?: any) => {
  // 🔥 FORM STATE WITH ALL CERTIFICATION FIELDS
  const [formData, setFormData] = useState<ExtendedCertifiedFormData>({
    name: '',
    description: '',
    type: 'single',
    fire_resistance: '',
    solution_number: '',
    materials: [],
    finishLevel: 'Q1',
    selectedSupplier: 'all',
  });

  // 🔥 CRITICAL FIX: Initialize from editing stratigraphy with ALL data
  useEffect(() => {
    if (editingStratigraphy && editingStratigraphy.stratigraphy) {
      const strat = editingStratigraphy.stratigraphy;
      const cert = editingStratigraphy.certification;
      const certMaterials = editingStratigraphy.materials || [];
      
      console.log('[useCertifiedStratigraphyForm] 🔄 COMPREHENSIVE INITIALIZATION:', {
        stratigraphy: {
          id: strat.id,
          name: strat.name,
          type: strat.type,
          description: strat.description,
          fire_resistance_class: strat.fire_resistance_class
        },
        certification: cert ? {
          id: cert.id,
          value: cert.value,
          solution_number: cert.solution_number,
          acoustic_reduction: cert.acoustic_reduction,
          supplier_name: cert.supplier_name,
          max_height: cert.max_height,
          acoustic_report_code: cert.acoustic_report_code,
          allCertFields: Object.keys(cert)
        } : 'NO CERTIFICATION DATA',
        materials: {
          count: certMaterials.length,
          samples: certMaterials.slice(0, 2).map(m => ({
            id: m.id,
            description: m.material_description,
            position_type: m.position_type
          }))
        }
      });

      setFormData(prev => {
        const newFormData = {
          ...prev,
          // Basic stratigraphy fields
          name: strat.name || '',
          description: strat.description || '',
          type: strat.type || 'single',
          
          // 🔥 CRITICAL: Map certification fields correctly
          fire_resistance: cert?.value || strat.fire_resistance_class || '',
          solution_number: cert?.solution_number || strat.solution_number || '',
          
          // Certified materials array
          materials: certMaterials || [],
          
          // 🔥 ALL optional certification fields
          max_height: cert?.max_height || strat.max_height,
          acoustic_reduction: cert?.acoustic_reduction || strat.acoustic_performance,
          acoustic_report_code: cert?.acoustic_report_code || strat.acoustic_report_code,
          solution_code: cert?.solution_code || strat.solution_code,
          extension_code: cert?.extension_code || strat.extension_code,
          supplier_name: cert?.supplier_name || strat.supplier_name,
          wall_thickness: cert?.wall_thickness || strat.wall_thickness,
          structure_width: cert?.structure_width || strat.structure_width,
          fire_test_report_code: cert?.fire_test_report_code || strat.fire_test_report_code,
          catalog_page: cert?.catalog_page || strat.catalog_page,
          curvature_radius: cert?.curvature_radius || strat.curvature_radius,
          curvature_radius_description: cert?.curvature_radius_description || strat.curvature_radius_description,
          break_resistance: cert?.break_resistance || strat.break_resistance,
          break_resistance_report_code: cert?.break_resistance_report_code || strat.break_resistance_report_code,
          break_resistance_notes: cert?.break_resistance_notes || strat.break_resistance_notes,
        };

        console.log('[useCertifiedStratigraphyForm] ✅ FORM FULLY INITIALIZED:', {
          name: newFormData.name,
          fire_resistance: newFormData.fire_resistance,
          solution_number: newFormData.solution_number,
          acoustic_reduction: newFormData.acoustic_reduction,
          supplier_name: newFormData.supplier_name,
          materialsCount: newFormData.materials?.length || 0,
          allFieldsPopulated: !!(newFormData.name && newFormData.fire_resistance)
        });

        return newFormData;
      });
    }
  }, [editingStratigraphy]);

  // Automatically determine wall type when layers change (only if not in edit mode)
  useEffect(() => {
    if (!editingStratigraphy && layers.length > 0) {
      const detectedType = determineWallType(layers);
      const certifiedType = mapWallTypeToCertified(detectedType);
      setFormData(prev => ({ ...prev, type: certifiedType }));
      console.log('[useCertifiedStratigraphyForm] 🔄 Auto-detected wall type:', certifiedType);
    }
  }, [layers, editingStratigraphy]);

  const handleFormChange = (field: keyof ExtendedCertifiedFormData, value: any) => {
    console.log('[useCertifiedStratigraphyForm] 📝 Form field changed:', field, '=', value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'single',
      fire_resistance: '',
      solution_number: '',
      materials: [],
      finishLevel: 'Q1',
      selectedSupplier: 'all',
    });
    console.log('[useCertifiedStratigraphyForm] 🔄 Form reset');
  };

  return {
    formData,
    handleFormChange,
    resetForm
  };
};
