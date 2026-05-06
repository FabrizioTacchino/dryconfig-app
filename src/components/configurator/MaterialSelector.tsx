import React from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { MaterialCategory } from '@/types';
import { useMaterialsByCategory, DatabaseMaterial } from '@/hooks/useMaterials';

interface MaterialSelectorProps {
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  category: MaterialCategory;
}

const MaterialSelector = ({ selectedIds, onSelect, category }: MaterialSelectorProps) => {
  const { data: materials = [], isLoading, error } = useMaterialsByCategory(category);

  // Aggiunto "screw"
  const categoryLabels: Record<MaterialCategory, string> = {
    board: 'Lastra',
    structure_frame: 'Struttura - Montanti',
    structure_guide: 'Struttura - Guide',
    insulation: 'Isolante',
    accessory: 'Accessorio',
    screw: 'Vite',         // <--- AGGIUNTO QUI
    other: 'Altro'
  };

  if (error) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 bg-muted/50 border-b">
          <h3 className="font-medium">Seleziona {categoryLabels[category]}</h3>
        </div>
        <div className="p-4 text-center text-red-600">
          Errore nel caricamento dei materiali: {error.message}
        </div>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-3 bg-muted/50 border-b">
        <h3 className="font-medium">Seleziona {categoryLabels[category]}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Codice</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Fornitore</TableHead>
              {category !== 'accessory' && <TableHead>Spessore</TableHead>}
              <TableHead>Prezzo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-muted-foreground">Caricamento materiali...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <span className="text-muted-foreground">
                    Nessun materiale disponibile in questa categoria
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => {
                const isSelected = selectedIds.includes(material.id);
                
                return (
                  <TableRow 
                    key={material.id}
                    className={isSelected ? 'bg-construction-primary/5' : ''}
                    onClick={() => onSelect(material.id, !isSelected)}
                  >
                    <TableCell className="p-2 text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect(material.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{material.code}</TableCell>
                    <TableCell>{material.name}</TableCell>
                    <TableCell className="text-sm">{material.supplier}</TableCell>
                    {category !== 'accessory' && (
                      <TableCell>{material.thickness || '-'} mm</TableCell>
                    )}
                    <TableCell className="font-medium">
                      €{material.unit_price.toFixed(2)}/{material.unit}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MaterialSelector;
