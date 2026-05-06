
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Layer } from '../types/StratigraphyTypes';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import LayerMaterialSelect from './LayerMaterialSelect';
import LayerThicknessInput from './LayerThicknessInput';

interface LayerFormProps {
  layer: Layer;
  materials?: DatabaseMaterial[];
  onChange: (updatedLayer: Partial<Layer>) => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const LayerForm = ({ layer, materials, onChange, onDelete, isFirst, isLast }: LayerFormProps) => {
  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
      <div className="flex-1">
        <LayerMaterialSelect
          material_id={layer.materialId}
          materials={materials || []}
          onMaterialChange={(materialId) => {
            const material = materials?.find(m => m.id === materialId);
            onChange({
              materialId,
              material,
              category: material?.category as any,
            });
          }}
        />
      </div>
      
      <div className="w-24">
        <LayerThicknessInput
          thickness={layer.thickness}
          onThicknessChange={(thickness) => onChange({ thickness })}
        />
      </div>

      {layer.material?.category === 'structure_frame' && (
        <div className="w-20">
          <input
            type="number"
            value={layer.interAxis || 600}
            onChange={(e) => onChange({ interAxis: Number(e.target.value) })}
            className="w-full px-2 py-1 text-xs border rounded"
            placeholder="600"
            min="1"
          />
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LayerForm;
