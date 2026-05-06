
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface PersonalizedStratigraphySubmissionHandlerProps {
  formData: any;
  layers: any[];
  totalThickness: number;
  comprehensiveCost: any;
  onSave: () => void;
  isSaving: boolean;
  editingStratigraphyId?: string;
}

const PersonalizedStratigraphySubmissionHandler: React.FC<PersonalizedStratigraphySubmissionHandlerProps> = ({
  formData,
  layers,
  totalThickness,
  comprehensiveCost,
  onSave,
  isSaving,
  editingStratigraphyId
}) => {
  const isFormValid = formData.name && layers.length > 0;

  return (
    <div className="flex justify-end pt-4">
      <Button 
        onClick={onSave}
        disabled={isSaving || !isFormValid}
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? 'Salvataggio...' : 'Salva Stratigrafia'}
      </Button>
    </div>
  );
};

export default PersonalizedStratigraphySubmissionHandler;
