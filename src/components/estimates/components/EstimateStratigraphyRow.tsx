
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Unlink, AlertTriangle } from 'lucide-react';
import { EstimateStratigraphy } from '@/hooks/useEstimateStratigraphies';
import MiniSectionPreview from '@/components/configurator-v2/list-view/MiniSectionPreview';
import { normalizeSnapshotLayers } from '@/components/configurator-v2/hooks/normalizeSnapshotLayers';
import EstimateStratigraphyActions from './EstimateStratigraphyActions';

interface EstimateStratigraphyRowProps {
  item: EstimateStratigraphy & { stratigraphy?: any };
  editingId: string | null;
  editData: any;
  canEdit: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUpdatingPrices?: boolean;
  onStartEdit: (stratigraphy: EstimateStratigraphy) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onUpdatePrices?: (estimateStratigraphyId: string, originalStratigraphyId: string) => void;
  onEditDataChange: (data: any) => void;
  /** Apre il dialog di ricollegamento al catalogo per row orfane. */
  onReconnect?: (item: EstimateStratigraphy & { stratigraphy?: any }) => void;
  /** Apre il viewer read-only dello snapshot per row orfane (chiamato dall'icona Eye). */
  onViewSnapshot?: (item: EstimateStratigraphy & { stratigraphy?: any }) => void;
}

const EstimateStratigraphyRow = ({
  item,
  editingId,
  editData,
  canEdit,
  isUpdating,
  isDeleting,
  isUpdatingPrices = false,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onUpdatePrices,
  onEditDataChange,
  onReconnect,
  onViewSnapshot,
}: EstimateStratigraphyRowProps) => {
  const isEditing = editingId === item.id;
  // Una row è "orfana" quando ha lo snapshot ma l'originale del catalogo è
  // stata eliminata (FK SET NULL → originalStratigraphyId NULL). Su queste
  // row non possiamo "Aggiorna prezzi" automatico — offriamo edit manuale.
  const isOrphan = !!item.isSnapshot && !item.originalStratigraphyId;

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleUpdatePrices = () => {
    if (onUpdatePrices && item.originalStratigraphyId) {
      console.log('Updating prices for item:', item.id, 'original:', item.originalStratigraphyId);
      onUpdatePrices(item.id, item.originalStratigraphyId);
    } else {
      console.warn('Cannot update prices - missing data:', {
        onUpdatePrices: !!onUpdatePrices,
        originalStratigraphyId: item.originalStratigraphyId
      });
    }
  };

  return (
    <TableRow key={item.id} className="hover:bg-gray-50">
      <TableCell>
        <div className="w-16 h-12 border border-gray-200 rounded overflow-hidden bg-white">
          {item.stratigraphy?.layers ? (
            <MiniSectionPreview
              layers={normalizeSnapshotLayers(item.stratigraphy.layers as unknown[])}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
              <span className="text-xs text-gray-400">N/A</span>
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <Input
            value={editData.name || ''}
            onChange={(e) => onEditDataChange({ ...editData, name: e.target.value })}
            className="min-w-48"
          />
        ) : (
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            {item.description && (
              <div className="text-sm text-muted-foreground mt-1">{item.description}</div>
            )}
            {item.isSnapshot && !isOrphan && (
              <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700 border-blue-200">
                Copia indipendente
              </Badge>
            )}
            {isOrphan && (
              <Badge variant="outline" className="text-xs mt-1 bg-amber-50 text-amber-800 border-amber-200 gap-1">
                <Unlink className="h-3 w-3" />
                Originale eliminata
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      
      <TableCell>
        <div className="space-y-2">
          <div>
            <div className="font-medium text-sm">{item.stratigraphy?.name || 'Nome non disponibile'}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {item.stratigraphy?.type || 'Tipo non specificato'}
            </div>
          </div>
          {item.stratigraphy?.total_thickness && (
            <Badge variant="outline" className="text-xs">
              {item.stratigraphy.total_thickness}mm
            </Badge>
          )}
          {item.stratigraphy?.is_certified && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              Certificata
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <Input
            type="number"
            value={editData.area || ''}
            onChange={(e) => onEditDataChange({ ...editData, area: Number(e.target.value) })}
            className="w-24"
            min="0"
            step="0.01"
          />
        ) : (
          <div className="font-mono text-sm">
            {item.area.toFixed(2)}
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {isEditing && isOrphan ? (
          <div className="space-y-1">
            <Input
              type="number"
              value={editData.unitCost ?? ''}
              onChange={(e) => onEditDataChange({ ...editData, unitCost: Number(e.target.value) })}
              className="w-24 font-mono"
              min="0"
              step="0.01"
            />
            <div className="text-[10px] text-amber-700 leading-tight">
              Modifica manuale (originale eliminata)
            </div>
          </div>
        ) : (
          <>
            <div className="font-mono text-sm">€ {item.unitCost.toFixed(2)}</div>
            {isEditing && !isOrphan && (
              <div className="text-xs text-muted-foreground mt-1">
                Costo fisso dal calcolo
              </div>
            )}
          </>
        )}
      </TableCell>
      
      <TableCell>
        <div className="font-semibold text-primary">
          € {item.totalCost.toFixed(2)}
        </div>
      </TableCell>

      <TableCell>
        <div className="text-xs">
          {item.isSnapshot ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Aggiornati al:</span>
              </div>
              <div className="font-medium">{formatDate(item.pricesUpdatedAt)}</div>
              {/* Aggiorna Prezzi: solo se l'originale del catalogo esiste ancora. */}
              {!isOrphan && onUpdatePrices && item.originalStratigraphyId && canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpdatePrices}
                  disabled={isUpdatingPrices}
                  className="mt-1 h-7 px-2 text-xs w-full"
                >
                  {isUpdatingPrices ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Aggiornando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Aggiorna Prezzi
                    </>
                  )}
                </Button>
              )}
              {/* Row orfana: aggiornamento auto non possibile, suggerisce
                  alternative. */}
              {isOrphan && canEdit && (
                <div className="space-y-1.5 mt-1">
                  <div className="flex items-start gap-1 text-amber-800 leading-tight">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="text-[11px]">
                      Originale eliminata: modifica il prezzo manualmente o ricollega al catalogo.
                    </span>
                  </div>
                  {onReconnect && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReconnect(item)}
                      className="h-7 px-2 text-xs w-full gap-1"
                    >
                      <Unlink className="h-3 w-3" />
                      Ricollega al catalogo
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Dati live</span>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <EstimateStratigraphyActions
          item={item}
          editingId={editingId}
          canEdit={canEdit}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          onStartEdit={() => onStartEdit(item)}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDelete(item.id)}
          onViewSnapshot={onViewSnapshot ? () => onViewSnapshot(item) : undefined}
        />
      </TableCell>
    </TableRow>
  );
};

export default EstimateStratigraphyRow;
