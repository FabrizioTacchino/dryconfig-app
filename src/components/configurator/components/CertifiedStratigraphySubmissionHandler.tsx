
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RotateCcw } from 'lucide-react';
import { CertifiedStratigraphyFormData } from '@/types/certification';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: any;
  interAxis?: number;
  screwMaterialId?: string;
  screwMaterial?: any;
  screwQuantity?: number;
  screwCostPerSqm?: number;
}

interface ExtendedCertifiedStratigraphyFormData extends CertifiedStratigraphyFormData {
  layers?: Layer[];
  totalCost?: number;
  materialCost?: number;
  laborCost?: number;
  screwCost?: number;
  installationTime?: number;
  weightPerSqm?: number;
}

interface CertifiedStratigraphySubmissionHandlerProps {
  formData: ExtendedCertifiedStratigraphyFormData;
  materials: any[];
  layers: Layer[];
  errors: any;
  isSaving: boolean;
  isValid: boolean;
  onSave: (data: ExtendedCertifiedStratigraphyFormData) => Promise<void>;
  onReset: () => void;
  totalCost: number;
  materialCost: number;
  laborCost: number;
  screwCost: number;
  installationTime: number;
  weightPerSqm: number;
  isEditMode: boolean;
}

const CertifiedStratigraphySubmissionHandler: React.FC<CertifiedStratigraphySubmissionHandlerProps> = ({
  formData,
  materials,
  layers,
  errors,
  isSaving,
  isValid,
  onSave,
  onReset,
  totalCost,
  materialCost,
  laborCost,
  screwCost,
  installationTime,
  weightPerSqm,
  isEditMode
}) => {
  const handleSaveClick = async () => {
    const dataToSave: ExtendedCertifiedStratigraphyFormData = {
      ...formData,
      layers,
      totalCost,
      materialCost,
      laborCost,
      screwCost,
      installationTime,
      weightPerSqm
    };
    
    await onSave(dataToSave);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Aggiorna Stratigrafia Certificata' : 'Salva Stratigraphy Certificata'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={handleSaveClick}
            disabled={!isValid || isSaving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvataggio...' : isEditMode ? 'Aggiorna' : 'Salva'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        
        {/* Cost Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Riepilogo Costi</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>Materiali:</span>
            <span>€{materialCost.toFixed(2)}/m²</span>
            <span>Viti:</span>
            <span>€{screwCost.toFixed(2)}/m²</span>
            <span>Manodopera:</span>
            <span>€{laborCost.toFixed(2)}/m²</span>
            <span className="font-medium">Totale:</span>
            <span className="font-medium">€{totalCost.toFixed(2)}/m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertifiedStratigraphySubmissionHandler;
