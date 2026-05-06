
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3, Trash2, Eye, Lock } from 'lucide-react';
import { EstimateStratigraphy } from '@/hooks/useEstimateStratigraphies';

interface EstimateStratigraphyActionsProps {
  item: EstimateStratigraphy & { stratigraphy?: any };
  editingId: string | null;
  canEdit: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

const EstimateStratigraphyActions = ({
  item,
  editingId,
  canEdit,
  isUpdating,
  isDeleting,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: EstimateStratigraphyActionsProps) => {
  const navigate = useNavigate();

  const handleViewStratigraphy = () => {
    const searchParams = new URLSearchParams({
      estimate: item.estimateId,
      tab: 'builder',
      stratigraphyId: item.stratigraphyId || item.id,
      viewOnly: 'true'
    });
    navigate(`/configurator?${searchParams.toString()}`);
  };

  if (editingId === item.id) {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onSaveEdit}
          disabled={isUpdating}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancelEdit}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-gray-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleViewStratigraphy}
        className="h-8 w-8 p-0"
        title="Visualizza stratigrafia"
      >
        <Eye className="h-4 w-4 text-blue-600" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onStartEdit}
        disabled={!canEdit}
        className={`h-8 w-8 p-0 ${!canEdit ? 'cursor-not-allowed' : ''}`}
        title={canEdit ? "Modifica parametri" : "Non modificabile: preventivo contrattualizzato"}
      >
        {canEdit ? (
          <Edit3 className="h-4 w-4 text-blue-600" />
        ) : (
          <Lock className="h-4 w-4 text-gray-400" />
        )}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        disabled={isDeleting || !canEdit}
        className={`h-8 w-8 p-0 ${canEdit ? 'text-red-600 hover:text-red-700' : 'text-gray-400 cursor-not-allowed'}`}
        title={canEdit ? "Elimina stratigrafia" : "Non eliminabile: preventivo contrattualizzato"}
      >
        {canEdit ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default EstimateStratigraphyActions;
