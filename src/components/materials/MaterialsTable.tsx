
import React from 'react';
import { MaterialCategory, DatabaseMaterial } from '@/hooks/useMaterials';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Copy, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteMaterial } from '@/hooks/useMaterialActions';
import { useMaterialDuplicate } from '@/hooks/useMaterialDuplicate';
import EditMaterialDialog from './EditMaterialDialog';
import CreateMaterialDialog from './CreateMaterialDialog';
import { MaterialSortField, SortDirection } from '@/hooks/useMaterialsSorting';
import MaterialDetailsCell from "./MaterialDetailsCell";
import MaterialDimensionsCell from "./MaterialDimensionsCell";
import { calculateFinalPrice } from '@/utils/discountUtils';

interface MaterialsTableProps {
  materials: DatabaseMaterial[];
  onEditMaterial?: (material: DatabaseMaterial) => void;
  sortField?: MaterialSortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: MaterialSortField) => void;
}

const MaterialsTable: React.FC<MaterialsTableProps> = ({
  materials,
  onEditMaterial,
  sortField,
  sortDirection,
  onSortChange,
}) => {
  const [editingMaterial, setEditingMaterial] = React.useState<DatabaseMaterial | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const { mutate: deleteMaterial, isPending: isDeleting } = useDeleteMaterial();
  const { mutate: duplicateMaterial, isPending: isDuplicating } = useMaterialDuplicate();

  const getCategoryLabel = (category: MaterialCategory) => {
    switch (category) {
      case 'board':
        return 'Lastra';
      case 'structure_frame':
        return 'Montante';
      case 'structure_guide':
        return 'Guida';
      case 'insulation':
        return 'Isolante';
      case 'accessory':
        return 'Accessorio';
      case 'screw':
        return 'Vite';
      case 'other':
        return 'Altro';
      default:
        return 'Sconosciuta';
    }
  };

  const calculateCostPerSqm = (material: DatabaseMaterial) => {
    const incidence = material.incidence_per_sqm || 1;
    // Calcola il prezzo finale usando la nuova logica di sconti cumulativi
    const finalPrice = calculateFinalPrice(material.unit_price, material.list_price, material.discount);
    return (finalPrice * incidence).toFixed(2);
  };

  const getSortIcon = (field: MaterialSortField) => {
    if (!sortField || sortField !== field) return <ArrowUpDown size={16} className="inline ml-1 text-zinc-300" />;
    if (sortDirection === 'asc') return <ArrowUp size={16} className="inline ml-1 text-primary" />;
    return <ArrowDown size={16} className="inline ml-1 text-primary" />;
  };

  const handleSort = (field: MaterialSortField) => {
    if (onSortChange) onSortChange(field);
  };

  const handleDeleteMaterial = (id: string) => {
    deleteMaterial(
      id,
      {
        onSuccess: () => {
          toast.success('Materiale eliminato con successo!');
        },
        onError: (error: Error) => {
          toast.error(`Errore durante l'eliminazione: ${error.message}`);
        },
      }
    );
  };

  const handleDuplicateMaterial = (material: DatabaseMaterial) => {
    duplicateMaterial(material);
  };

  const handleEditMaterial = (material: DatabaseMaterial) => {
    if (onEditMaterial) {
      onEditMaterial(material);
    } else {
      setEditingMaterial(material);
    }
  };

  const handleMaterialUpdated = () => {
    setEditingMaterial(null);
  };

  const handleMaterialCreated = () => {
    setIsCreateDialogOpen(false);
  };

  const renderMaterialDetails = (material: DatabaseMaterial) => {
    if (material.category === 'board') {
      return (
        <div>
          <div className="font-medium">{material.name}</div>
          {material.material_type && (
            <div className="text-sm text-muted-foreground">
              Tipo: {material.material_type}
            </div>
          )}
          {material.fire_class && (
            <div className="text-sm text-muted-foreground">
              Classe fuoco: {material.fire_class}
            </div>
          )}
          {material.description && (
            <div className="text-sm text-muted-foreground truncate max-w-xs">
              {material.description}
            </div>
          )}
        </div>
      );
    }
    if (material.category === 'screw') {
      return (
        <div>
          <div className="font-medium">{material.name}</div>
          {material.box_pieces && (
            <div className="text-xs text-blue-800 font-mono">
              {material.box_pieces} pz/scatola
            </div>
          )}
          {Array.isArray(material.compatible_board_types) && material.compatible_board_types.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {material.compatible_board_types.map((matType, i) => (
                <span
                  key={i}
                  className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                >
                  {matType}
                </span>
              ))}
            </div>
          )}
          {material.description && (
            <div className="text-xs text-muted-foreground mt-1">
              {material.description}
            </div>
          )}
        </div>
      );
    }
    if (material.category === 'other') {
      return (
        <div>
          <div className="font-medium">{material.name}</div>
          {material.description && (
            <div className="text-sm text-muted-foreground truncate max-w-xs">
              {material.description}
            </div>
          )}
          {material.mechanical_performance && (
            <div className="text-xs text-teal-700">Meccaniche: {material.mechanical_performance}</div>
          )}
          {material.thermal_performance_notes && (
            <div className="text-xs text-blue-700">Termo-igrometriche: {material.thermal_performance_notes}</div>
          )}
          {material.sustainability_notes && (
            <div className="text-xs text-green-600">Sostenibilità: {material.sustainability_notes}</div>
          )}
          {material.system_compatibility && (
            <div className="text-xs text-indigo-600">Compatibilità: {material.system_compatibility}</div>
          )}
          {material.fire_performance_notes && (
            <div className="text-xs text-orange-600">Fuoco: {material.fire_performance_notes}</div>
          )}
        </div>
      );
    }
    return (
      <div>
        <div className="font-medium">{material.name}</div>
        {material.description && (
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {material.description}
          </div>
        )}
      </div>
    );
  };

  const renderDimensions = (material: DatabaseMaterial) => {
    if (material.category === 'screw') {
      return material.thickness ? `Lunghezza: ${material.thickness} mm` : '-';
    }
    if (material.category === 'board') {
      return (
        <div className="text-sm">
          {material.width && material.length && material.thickness && (
            <div>
              {material.width} × {material.length} × {material.thickness} mm
            </div>
          )}
          {material.density && (
            <div className="text-muted-foreground">
              Densità: {material.density} kg/m³
            </div>
          )}
        </div>
      );
    }
    if (material.category === 'other') {
      if (material.is_variable_thickness) {
        return "Spessore variabile";
      }
      return material.thickness ? `${material.thickness} mm` : '-';
    }
    return material.thickness ? `${material.thickness} mm` : '-';
  };

  if (!materials.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Nessun materiale trovato con i filtri attuali.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('code')}
              >
                Codice {getSortIcon('code')}
              </TableHead>
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                Materiale {getSortIcon('name')}
              </TableHead>
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('category')}
              >
                Categoria {getSortIcon('category')}
              </TableHead>
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('supplier')}
              >
                Fornitore {getSortIcon('supplier')}
              </TableHead>
              <TableHead>
                Dimensioni
              </TableHead>
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('unit_price')}
              >
                Prezzo Unitario {getSortIcon('unit_price')}
              </TableHead>
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('discount')}
              >
                Sconto % {getSortIcon('discount')}
              </TableHead>
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('incidence_per_sqm')}
              >
                Incidenza {getSortIcon('incidence_per_sqm')}
              </TableHead>
              <TableHead>
                Tempo di posa
              </TableHead>
              <TableHead
                role="button"
                className="cursor-pointer select-none"
                onClick={() => handleSort('cost_per_sqm')}
              >
                Costo/m² {getSortIcon('cost_per_sqm')}
              </TableHead>
              <TableHead className="w-32">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {material.code}
                  </Badge>
                </TableCell>
                <TableCell>
                  <MaterialDetailsCell material={material} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getCategoryLabel(material.category)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{material.supplier}</TableCell>
                <TableCell>
                  <MaterialDimensionsCell material={material} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    €{material.unit_price.toFixed(2)}/{material.unit}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                    {material.discount || '0'}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {material.incidence_per_sqm?.toFixed(3) || '1.000'} {material.unit}/m²
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    {material.installation_time_per_sqm ? 
                      `${material.installation_time_per_sqm.toFixed(2)} min/${material.unit}` : 
                      '-'
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-construction-light text-construction-primary font-medium">
                    €{calculateCostPerSqm(material)}/m²
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMaterial(material)}
                      title="Modifica materiale"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateMaterial(material)}
                      disabled={isDuplicating}
                      title="Duplica materiale"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="text-destructive hover:text-destructive"
                      title="Elimina materiale"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog per creazione rapida */}
      <CreateMaterialDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleMaterialCreated}
      />

      {editingMaterial && (
        <EditMaterialDialog
          material={editingMaterial}
          open={!!editingMaterial}
          onOpenChange={(open) => !open && setEditingMaterial(null)}
          onSuccess={handleMaterialUpdated}
        />
      )}
    </div>
  );
};

export default MaterialsTable;
