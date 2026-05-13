import React, { useState } from 'react';
import { Estimate } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { CalendarIcon, FileTextIcon, TrashIcon, Calculator, ChevronDown, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEstimateStratigraphies } from '@/hooks/useEstimateStratigraphies';
import { useEstimates } from '@/hooks/useEstimates';

interface EstimateCardProps {
  estimate: Estimate;
  onDelete: (id: string) => void;
  onConfigure: (id: string) => void;
  onManage: (id: string) => void;
  onStatusChange?: (id: string, status: Estimate['status']) => void;
}

const EstimateCard = ({ estimate, onDelete, onConfigure, onManage, onStatusChange }: EstimateCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const { estimateStratigraphies } = useEstimateStratigraphies(estimate.id);
  const { duplicateEstimate, isDuplicating } = useEstimates(estimate.projectId);

  // F30 — workflow Bozza/Inviato/Vinto/Perso. I valori pending/approved/contracted
  // sono legacy: vengono mappati sul colore corrispondente per coerenza visiva.
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    sent: 'bg-amber-100 text-amber-800 border-amber-200',
    won: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    lost: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    contracted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Bozza',
    sent: 'Inviato',
    won: 'Vinto',
    lost: 'Perso',
    pending: 'Inviato',
    approved: 'Vinto',
    contracted: 'Vinto',
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(estimate.id);
    setShowDeleteDialog(false);
  };

  const handleStatusChange = (newStatus: Estimate['status']) => {
    console.log('EstimateCard handleStatusChange called:', { 
      estimateId: estimate.id, 
      currentStatus: estimate.status, 
      newStatus,
      onStatusChange: !!onStatusChange 
    });
    
    if (onStatusChange) {
      onStatusChange(estimate.id, newStatus);
    } else {
      console.error('onStatusChange is not provided to EstimateCard');
    }
  };

  const handleDuplicate = () => {
    setDuplicateName(`${estimate.name} (Copia)`);
    setShowDuplicateDialog(true);
  };

  const handleConfirmDuplicate = () => {
    duplicateEstimate({
      estimate,
      estimateStratigraphies,
      newName: duplicateName,
    });
    setShowDuplicateDialog(false);
  };

  return (
    <>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg line-clamp-2">{estimate.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("ml-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors hover:bg-opacity-80", statusColors[estimate.status])}>
                  {statusLabels[estimate.status]}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                  Bozza
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('sent')}>
                  Inviato
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('won')}>
                  Vinto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('lost')}>
                  Perso
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Pulsante duplica preventivo */}
            <button
              className="ml-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border bg-blue-50 hover:bg-blue-200 text-blue-900"
              onClick={handleDuplicate}
              title="Duplica preventivo"
              disabled={isDuplicating}
            >
              <Copy className="h-3 w-3" />
              Duplica
            </button>
          </div>
          
          {estimate.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {estimate.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <FileTextIcon className="h-4 w-4 mr-2" />
            <span>Versione {estimate.version}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>{estimate.createdAt.toLocaleDateString('it-IT')}</span>
          </div>
          <div className="text-lg font-semibold text-primary">
            € {estimate.totalAmount.toLocaleString('it-IT')}
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/50 px-6 py-3 flex justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManage(estimate.id)}
          >
            <Calculator className="h-4 w-4 mr-1" />
            Riepilogo
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplica Preventivo</DialogTitle>
          </DialogHeader>
          <label htmlFor="duplicate-name" className="block mb-2">
            Nome nuovo preventivo
          </label>
          <Input
            id="duplicate-name"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            className="mb-2"
          />
          <DialogFooter>
            <Button
              onClick={handleConfirmDuplicate}
              disabled={isDuplicating || !duplicateName}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Conferma Duplica
            </Button>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Annulla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il preventivo "{estimate.name}"? 
              Questa azione eliminerà anche tutte le stratigrafie associate e non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EstimateCard;
