
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, X, Check, FileStack } from 'lucide-react';
import { Estimate } from '@/types';
import ExportDropdown from './ExportDropdown';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useEstimates } from '@/hooks/useEstimates';
import EstimateNotesField from "./EstimateNotesField";
import { useEstimateNotes } from "@/hooks/useEstimateNotes";
import { useOrgProfile } from "@/hooks/useOrgSettings";
import { Sentry } from "@/lib/sentry";

interface EstimateHeaderProps {
  estimate: Estimate;
  stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[];
}

const EstimateHeader = ({ estimate, stratigraphies }: EstimateHeaderProps) => {
  const navigate = useNavigate();
  const { updateEstimateStatus, isUpdatingStatus } = useEstimates();
  const [isEditing, setIsEditing] = useState(false);
  const [tmpName, setTmpName] = useState(estimate.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingRDA, setIsExportingRDA] = useState(false);
  const { data: orgProfile } = useOrgProfile();

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    contracted: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const statusLabels = {
    draft: 'Bozza',
    pending: 'In Attesa',
    approved: 'Approvato',
    contracted: 'Contrattualizzato',
  };

  // Funzione per aggiornare solo il nome del preventivo
  const handleSaveName = async () => {
    if (tmpName.trim() === '') {
      toast({ title: 'Il nome non può essere vuoto' });
      return;
    }
    setIsSaving(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('estimates')
        .update({ name: tmpName })
        .eq('id', estimate.id);

      if (error) throw error;
      toast({ title: 'Nome preventivo aggiornato!' });
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Errore nel salvataggio del nome' });
    }
    setIsSaving(false);
  };

  // Gestione notes
  const { saveNotes, isSaving: isSavingNotes } = useEstimateNotes(estimate.id);

  // Funzione per export RDA Completa
  const handleExportCompleteRDA = async () => {
    if (isExportingRDA) return;

    setIsExportingRDA(true);
    try {
      const { exportCompleteRDA } = await import('@/utils/export');
      await exportCompleteRDA(estimate, stratigraphies, orgProfile ?? null);
      toast({
        title: 'RDA Completa generata con successo!',
        description: 'Il documento completo con tutte le stratigrafie è stato scaricato.',
      });
    } catch (error) {
      console.error('Errore export RDA Completa:', error);
      // Manda in Sentry con contesto utile per il debug
      Sentry.captureException(error, {
        tags: { feature: 'export-rda' },
        extra: {
          estimateId: estimate?.id,
          stratigraphyCount: stratigraphies?.length,
        },
      });
      const errMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Errore generazione RDA',
        description: errMsg.slice(0, 200),
        variant: 'destructive',
      });
    } finally {
      setIsExportingRDA(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex gap-2">
        <Button 
          onClick={() => navigate(`/projects/${estimate.projectId}`)} 
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al Progetto
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div className="flex flex-col gap-1 w-full max-w-2xl">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Input
                  value={tmpName}
                  onChange={(e) => setTmpName(e.target.value)}
                  className="max-w-xs"
                  disabled={isSaving}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setTmpName(estimate.name);
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveName}
                  disabled={isSaving}
                  aria-label="Salva"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setTmpName(estimate.name);
                  }}
                  disabled={isSaving}
                  aria-label="Annulla"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">
                  {estimate.name}
                </h1>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsEditing(true)} 
                  aria-label="Modifica nome">
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {estimate.description || 'Gestisci le stratigrafie e i costi del preventivo'}
          </p>
          {/* NOTE FIELD AGGIORNATA GRAFICAMENTE */}
          <div className="w-full max-w-xl mt-2">
            <EstimateNotesField
              note={estimate.notes}
              onSave={async (text) => { await saveNotes(text); }}
              disabled={isSavingNotes}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge className={statusColors[estimate.status]}>
            {statusLabels[estimate.status]}
          </Badge>
          <Button 
            variant="default" 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleExportCompleteRDA}
            disabled={isExportingRDA}
          >
            <FileStack className="h-4 w-4" />
            {isExportingRDA ? 'Generando...' : 'Stampa RDA Completa'}
          </Button>
          <ExportDropdown estimate={estimate} stratigraphies={stratigraphies} />
        </div>
      </div>
    </div>
  );
};

export default EstimateHeader;
