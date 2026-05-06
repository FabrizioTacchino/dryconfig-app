
import React from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { canEditThickness } from '../utils/materialUtils';

interface LayerThicknessInputProps {
  thickness: number;
  material?: DatabaseMaterial;
  onThicknessChange: (thickness: number) => void;
}

const LayerThicknessInput = ({ 
  thickness, 
  material, 
  onThicknessChange 
}: LayerThicknessInputProps) => {
  const isThicknessEditable = canEditThickness(material);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Input
          type="number"
          value={thickness}
          onChange={(e) => onThicknessChange(Number(e.target.value))}
          className={`w-20 text-sm ${!isThicknessEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          min="0.1"
          max="1000"
          step="0.1"
          disabled={!isThicknessEditable}
        />
        {!isThicknessEditable && (
          <Lock className="h-3 w-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        )}
      </div>
      <span className="text-xs text-gray-500">mm</span>
      {!isThicknessEditable && (
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Fisso</span>
      )}
      {isThicknessEditable && (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Variabile</span>
      )}
    </div>
  );
};

export default LayerThicknessInput;
