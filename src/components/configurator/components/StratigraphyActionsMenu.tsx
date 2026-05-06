import React, { useState } from 'react';
import { MoreHorizontal, Edit, Copy, Trash2, Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddToEstimateDialog from './AddToEstimateDialog';
import StratigraphyDeleteDialog from './dialogs/StratigraphyDeleteDialog';
import { useNavigate } from 'react-router-dom';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';
import { useStratigraphyDuplicateHandler } from './actions/StratigraphyDuplicateHandler';
import { useStratigraphyDeleteHandler } from './actions/StratigraphyDeleteHandler';
import { useUserRole } from '@/hooks/useUserRole';
import { useEstimates } from '@/hooks/useEstimates';
import { toast } from 'sonner';

interface StratigraphyActionsMenuProps {
  stratigraphy: UnifiedStratigraphy;
  onEdit?: (stratigraphy: UnifiedStratigraphy) => void;
  onDuplicate?: (stratigraphy: UnifiedStratigraphy) => void;
  onDelete?: (stratigraphy: UnifiedStratigraphy) => void;
}

const StratigraphyActionsMenu = ({ 
  stratigraphy, 
  onEdit, 
  onDuplicate, 
  onDelete 
}: StratigraphyActionsMenuProps) => {
  const [showAddToEstimate, setShowAddToEstimate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const navigate = useNavigate();

  const { handleDuplicate } = useStratigraphyDuplicateHandler();
  const { handleDelete } = useStratigraphyDeleteHandler();
  const { isAdmin, isSuperUser, loading: roleLoading } = useUserRole();
  const { estimates } = useEstimates();

  // Controlla se ci sono preventivi contrattualizzati che potrebbero limitare l'aggiunta
  const hasContractedEstimates = estimates.some(e => e.status === 'contracted');

  const handleEdit = () => {
    console.log('Navigating to edit stratigraphy:', stratigraphy.id, 'is_certified:', stratigraphy.is_certified);
    
    if (onEdit) {
      onEdit(stratigraphy);
    } else {
      // Verifica che la stratigrafia esista prima di navigare
      if (!stratigraphy.id) {
        toast.error('Impossibile modificare: ID stratigrafia non valido');
        return;
      }

      // 🔥 DISTINGUISH BETWEEN CERTIFIED AND PERSONALIZED STRATIGRAPHIES
      let searchParams: URLSearchParams;
      
      if (stratigraphy.is_certified) {
        // For certified stratigraphies: navigate to certified tab with edit parameter
        searchParams = new URLSearchParams({
          tab: 'certified',
          editCertifiedStratigraphy: stratigraphy.id
        });
        console.log('[StratigraphyActionsMenu] Navigating to CERTIFIED edit:', stratigraphy.id);
      } else {
        // For personalized stratigraphies: navigate to builder tab with edit parameter
        searchParams = new URLSearchParams({
          tab: 'builder',
          editStratigraphy: stratigraphy.id
        });
        console.log('[StratigraphyActionsMenu] Navigating to PERSONALIZED edit:', stratigraphy.id);
      }
      
      const url = `/configurator?${searchParams.toString()}`;
      console.log('[StratigraphyActionsMenu] Navigation URL:', url);
      
      try {
        navigate(url);
      } catch (error) {
        console.error('Navigation error:', error);
        toast.error('Errore durante la navigazione alla modifica');
      }
    }
  };

  const handleDuplicateClick = async () => {
    setIsDuplicating(true);
    try {
      await handleDuplicate(stratigraphy, onDuplicate);
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('Errore durante la duplicazione');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await handleDelete(stratigraphy, onDelete);
      if (!result.success) {
        toast.error('Errore durante l\'eliminazione');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Errore durante l\'eliminazione');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddToEstimateClick = () => {
    if (hasContractedEstimates) {
      // Mostra un avviso che alcuni preventivi potrebbero non essere disponibili
      toast.info('Nota: alcuni preventivi contrattualizzati non saranno modificabili');
    }
    setShowAddToEstimate(true);
  };

  // Determina se l'utente può eliminare questa stratigrafia
  const canDelete = () => {
    if (roleLoading) return false;
    
    // Stratigrafie non certificate: tutti possono eliminare le proprie
    if (!stratigraphy.is_certified) {
      return true;
    }
    
    // Stratigrafie certificate: solo admin o super_user
    return isAdmin || isSuperUser;
  };

  const getDeleteTooltip = () => {
    if (stratigraphy.is_certified && !isAdmin && !isSuperUser) {
      return 'Solo amministratori possono eliminare stratigrafie certificate';
    }
    return null;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleAddToEstimateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Aggiungi al Preventivo
            {hasContractedEstimates && (
              <Lock className="h-3 w-3 text-amber-500 ml-auto" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Modifica {stratigraphy.is_certified ? 'Certificata' : ''}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDuplicateClick} 
            className="gap-2"
            disabled={isDuplicating}
          >
            <Copy className="h-4 w-4" />
            {isDuplicating ? 'Duplicando...' : 'Duplica'}
          </DropdownMenuItem>
          {canDelete() ? (
            <DropdownMenuItem 
              onClick={() => setShowDeleteConfirm(true)} 
              className="gap-2 text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Elimina
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              disabled
              className="gap-2 text-gray-400"
              title={getDeleteTooltip()}
            >
              <Trash2 className="h-4 w-4" />
              {stratigraphy.is_certified ? 'Riservato agli admin' : 'Non eliminabile'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AddToEstimateDialog
        open={showAddToEstimate}
        onOpenChange={setShowAddToEstimate}
        stratigraphy={stratigraphy}
      />

      <StratigraphyDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        stratigraphy={stratigraphy}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default StratigraphyActionsMenu;
