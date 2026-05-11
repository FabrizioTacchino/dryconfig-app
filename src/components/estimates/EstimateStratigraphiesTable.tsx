
import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EstimateStratigraphy } from '@/hooks/useEstimateStratigraphies';
import EstimateStratigraphiesEmptyState from './components/EstimateStratigraphiesEmptyState';
import EstimateStratigraphyRow from './components/EstimateStratigraphyRow';
import ReconnectStratigraphyDialog from './ReconnectStratigraphyDialog';
import SnapshotViewerDialog from './SnapshotViewerDialog';
import { EstimateStratigraphySortField, SortDirection } from '@/hooks/useEstimateStratigraphiesSorting';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface EstimateStratigraphiesTableProps {
  stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[];
  onUpdateStratigraphy: (id: string, data: any) => void;
  onDeleteStratigraphy: (id: string) => void;
  onUpdatePrices?: (estimateStratigraphyId: string, originalStratigraphyId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isUpdatingPrices?: boolean;
  estimateStatus?: string;
  // nuovi props per sorting
  sortField: EstimateStratigraphySortField;
  sortDirection: SortDirection;
  onSortChange: (field: EstimateStratigraphySortField) => void;
}

const EstimateStratigraphiesTable = ({
  stratigraphies,
  onUpdateStratigraphy,
  onDeleteStratigraphy,
  onUpdatePrices,
  isUpdating,
  isDeleting,
  isUpdatingPrices = false,
  estimateStatus = 'draft',
  sortField,
  sortDirection,
  onSortChange,
}: EstimateStratigraphiesTableProps) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editData, setEditData] = React.useState<any>({});
  // Stato dialog "Ricollega al catalogo" per row orfane (originale eliminata).
  const [reconnectItem, setReconnectItem] = React.useState<
    (EstimateStratigraphy & { stratigraphy?: any }) | null
  >(null);
  // Stato dialog "Visualizza snapshot" (read-only) per row orfane: l'icona
  // Eye non può aprire il configuratore (id catalogo NULL) → snapshot viewer.
  const [snapshotItem, setSnapshotItem] = React.useState<
    (EstimateStratigraphy & { stratigraphy?: any }) | null
  >(null);

  const canEdit = estimateStatus !== 'contracted';

  const handleStartEdit = (stratigraphy: EstimateStratigraphy) => {
    setEditingId(stratigraphy.id);
    setEditData({
      name: stratigraphy.name,
      area: stratigraphy.area,
      // unitCost editabile SOLO sulle row orfane (originale eliminata): la
      // row component lo mostra come input quando isSnapshot=true e
      // originalStratigraphyId è null. Per le altre row il campo è incluso
      // ma ignorato dalla UI (read-only display).
      unitCost: stratigraphy.unitCost,
    });
  };

  const handleSaveEdit = () => {
    if (editingId) {
      onUpdateStratigraphy(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const getSortIcon = (field: EstimateStratigraphySortField) => {
    if (sortField !== field) return <ArrowUpDown size={16} className="inline text-zinc-300 ml-1" />;
    if (sortDirection === 'asc') return <ArrowUp size={16} className="inline text-primary ml-1" />;
    return <ArrowDown size={16} className="inline text-primary ml-1" />;
  };

  const handleSort = (field: EstimateStratigraphySortField) => {
    onSortChange(field);
  };

  if (stratigraphies.length === 0) {
    return <EstimateStratigraphiesEmptyState />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-24">Anteprima</TableHead>
            <TableHead
              role="button"
              className="cursor-pointer select-none"
              onClick={() => handleSort('name')}
            >
              Nome & Dettagli {getSortIcon('name')}
            </TableHead>
            <TableHead>Tipo & Specifiche</TableHead>
            <TableHead
              role="button"
              className="cursor-pointer select-none"
              onClick={() => handleSort('area')}
            >
              Superficie (m²) {getSortIcon('area')}
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer select-none"
              onClick={() => handleSort('unitCost')}
            >
              Costo Unitario {getSortIcon('unitCost')}
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer select-none"
              onClick={() => handleSort('totalCost')}
            >
              Totale {getSortIcon('totalCost')}
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer select-none"
              onClick={() => handleSort('pricesUpdatedAt')}
            >
              Prezzi Aggiornati {getSortIcon('pricesUpdatedAt')}
            </TableHead>
            <TableHead className="w-48">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stratigraphies.map((item) => (
            <EstimateStratigraphyRow
              key={item.id}
              item={item}
              editingId={editingId}
              editData={editData}
              canEdit={canEdit}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              isUpdatingPrices={isUpdatingPrices}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDelete={onDeleteStratigraphy}
              onUpdatePrices={onUpdatePrices}
              onEditDataChange={setEditData}
              onReconnect={setReconnectItem}
              onViewSnapshot={setSnapshotItem}
            />
          ))}
        </TableBody>
      </Table>

      <ReconnectStratigraphyDialog
        open={!!reconnectItem}
        onOpenChange={(open) => { if (!open) setReconnectItem(null); }}
        item={reconnectItem}
      />

      <SnapshotViewerDialog
        open={!!snapshotItem}
        onOpenChange={(open) => { if (!open) setSnapshotItem(null); }}
        item={snapshotItem}
        onReconnect={() => {
          if (snapshotItem) {
            setReconnectItem(snapshotItem);
            setSnapshotItem(null);
          }
        }}
      />
    </div>
  );
};

export default EstimateStratigraphiesTable;
