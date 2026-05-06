
import React from 'react';
import { CertifiedStratigraphyFormData } from '@/types/certification';
import { useCertifiedStratigraphySave } from '@/hooks/useCertifiedStratigraphySave';
import CertifiedStratigraphyFormContainer from './CertifiedStratigraphyFormContainer';

interface CertifiedStratigraphyFormProps {
  onSave?: (data: CertifiedStratigraphyFormData) => Promise<void>;
  isSaving?: boolean;
  editingStratigraphy?: any; // 🔥 NEW: Add support for editing existing certified stratigraphies
}

const CertifiedStratigraphyForm = ({ onSave, isSaving = false, editingStratigraphy }: CertifiedStratigraphyFormProps) => {
  const { mutate: saveCertified, isPending: isInternalSaving } = useCertifiedStratigraphySave();
  
  const handleSave = async (data: CertifiedStratigraphyFormData) => {
    console.log('🎯 [CertifiedStratigraphyForm] RICEVENDO DATI COMPLETI PER SALVATAGGIO:', {
      totalCost: (data as any).totalCost,
      materialCost: (data as any).materialCost,
      laborCost: (data as any).laborCost,
      screwCost: (data as any).screwCost,
      installationTime: (data as any).installationTime
    });

    if (onSave) {
      // Use external save function if provided
      await onSave(data);
    } else {
      // Use internal save function with complete functionality
      saveCertified(data as any);
    }
  };

  const finalIsSaving = isSaving || isInternalSaving;

  return (
    <CertifiedStratigraphyFormContainer 
      onSave={handleSave}
      isSaving={finalIsSaving}
      editingStratigraphy={editingStratigraphy} // 🔥 PASS EDITING DATA TO CONTAINER
    />
  );
};

export default CertifiedStratigraphyForm;
