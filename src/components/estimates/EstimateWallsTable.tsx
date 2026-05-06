
import React, { useState } from 'react';
import { EstimateWall, UpdateEstimateWallData } from '@/types/estimate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstimateWallsTableProps {
  walls: EstimateWall[];
  onUpdateWall: (wallData: UpdateEstimateWallData) => void;
  onDeleteWall: (wallId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const EstimateWallsTable = ({ 
  walls, 
  onUpdateWall, 
  onDeleteWall, 
  isUpdating, 
  isDeleting 
}: EstimateWallsTableProps) => {
  const [editingWall, setEditingWall] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EstimateWall>>({});

  const wallTypeLabels = {
    plating: 'Placcatura',
    counterwall: 'Controparete',
    single: 'Parete singola',
    double: 'Parete doppia',
    ceiling: 'Controsoffitto',
  };

  const handleStartEdit = (wall: EstimateWall) => {
    setEditingWall(wall.id);
    setEditData(wall);
  };

  const handleCancelEdit = () => {
    setEditingWall(null);
    setEditData({});
  };

  const handleSaveEdit = () => {
    if (!editingWall || !editData) return;

    onUpdateWall({
      id: editingWall,
      name: editData.name,
      area: editData.area,
      pricePerSqm: editData.pricePerSqm,
      materialCost: editData.materialCost,
      laborCost: editData.laborCost,
      accessoriesCost: editData.accessoriesCost,
      notes: editData.notes,
    });

    setEditingWall(null);
    setEditData({});
  };

  const handleInputChange = (field: keyof EstimateWall, value: string | number) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (walls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nessuna parete aggiunta al preventivo</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipologia</TableHead>
            <TableHead>Area (m²)</TableHead>
            <TableHead>€/m²</TableHead>
            <TableHead>Costo Materiali</TableHead>
            <TableHead>Costo Manodopera</TableHead>
            <TableHead>Costo Accessori</TableHead>
            <TableHead>Totale</TableHead>
            <TableHead>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walls.map((wall) => (
            <TableRow key={wall.id}>
              <TableCell>
                {editingWall === wall.id ? (
                  <Input
                    value={editData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full"
                  />
                ) : (
                  wall.name
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {wallTypeLabels[wall.wallType]}
                </Badge>
              </TableCell>
              <TableCell>
                {editingWall === wall.id ? (
                  <Input
                    type="number"
                    value={editData.area || 0}
                    onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                ) : (
                  wall.area.toFixed(2)
                )}
              </TableCell>
              <TableCell>
                {editingWall === wall.id ? (
                  <Input
                    type="number"
                    value={editData.pricePerSqm || 0}
                    onChange={(e) => handleInputChange('pricePerSqm', parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                ) : (
                  `€ ${wall.pricePerSqm.toFixed(2)}`
                )}
              </TableCell>
              <TableCell>
                {editingWall === wall.id ? (
                  <Input
                    type="number"
                    value={editData.materialCost || 0}
                    onChange={(e) => handleInputChange('materialCost', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                ) : (
                  `€ ${wall.materialCost.toFixed(2)}`
                )}
              </TableCell>
              <TableCell>
                {editingWall === wall.id ? (
                  <Input
                    type="number"
                    value={editData.laborCost || 0}
                    onChange={(e) => handleInputChange('laborCost', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                ) : (
                  `€ ${wall.laborCost.toFixed(2)}`
                )}
              </TableCell>
              <TableCell>
                {editingWall === wall.id ? (
                  <Input
                    type="number"
                    value={editData.accessoriesCost || 0}
                    onChange={(e) => handleInputChange('accessoriesCost', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                ) : (
                  `€ ${wall.accessoriesCost.toFixed(2)}`
                )}
              </TableCell>
              <TableCell className="font-semibold">
                € {editingWall === wall.id 
                  ? ((editData.materialCost || 0) + (editData.laborCost || 0) + (editData.accessoriesCost || 0)).toFixed(2)
                  : wall.totalCost.toFixed(2)
                }
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {editingWall === wall.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isUpdating}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(wall)}
                        disabled={isUpdating || isDeleting}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteWall(wall.id)}
                        disabled={isUpdating || isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EstimateWallsTable;
