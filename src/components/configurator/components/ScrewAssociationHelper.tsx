
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types';

interface ScrewAssociationHelperProps {
  boardLayer: any;
  availableMaterials: DatabaseMaterial[];
  onAddScrew: (parentLayerId: string) => void;
  associatedScrews: any[];
}

const ScrewAssociationHelper: React.FC<ScrewAssociationHelperProps> = ({
  boardLayer,
  availableMaterials,
  onAddScrew,
  associatedScrews
}) => {
  const screwMaterials = availableMaterials.filter(m => m.category === 'screw');
  
  if (boardLayer.category !== 'board') {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-800">
          🔩 Viti Associate ({associatedScrews.length})
        </span>
        <Button
          onClick={() => onAddScrew(boardLayer.id)}
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-300 hover:bg-blue-100"
        >
          <Plus className="h-3 w-3 mr-1" />
          Aggiungi Vite
        </Button>
      </div>
      
      {associatedScrews.length > 0 && (
        <div className="space-y-1">
          {associatedScrews.map(screw => (
            <div key={screw.id} className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
              {screw.material?.name || 'Vite non specificata'} - 
              Quantità: {screw.equalPartsQuantity || 25}/m²
            </div>
          ))}
        </div>
      )}
      
      {screwMaterials.length === 0 && (
        <div className="text-xs text-orange-600">
          ⚠️ Nessuna vite disponibile nel database
        </div>
      )}
    </div>
  );
};

export default ScrewAssociationHelper;
