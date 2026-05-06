
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';
import { EstimateStratigraphy } from '@/hooks/useEstimateStratigraphies';
import MiniStratigraphyPreview from '@/components/configurator/components/MiniStratigraphyPreview';
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
}: EstimateStratigraphyRowProps) => {
  const isEditing = editingId === item.id;

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
          {item.stratigraphy ? (
            <MiniStratigraphyPreview 
              stratigraphy={item.stratigraphy}
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
            {item.isSnapshot && (
              <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700">
                Copia Indipendente
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
        <div className="font-mono text-sm">
          € {item.unitCost.toFixed(2)}
        </div>
        {isEditing && (
          <div className="text-xs text-muted-foreground mt-1">
            Costo fisso dal calcolo
          </div>
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
              {onUpdatePrices && item.originalStratigraphyId && canEdit && (
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
        />
      </TableCell>
    </TableRow>
  );
};

export default EstimateStratigraphyRow;
