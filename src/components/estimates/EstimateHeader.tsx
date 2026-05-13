
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, X, Check, FileText, FileStack, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useGenerateOfferNumber } from "@/hooks/useOfferNumber";
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
  const generateOfferNumber = useGenerateOfferNumber();

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
  /**
   * Genera (o legge) il numero offerta e poi esegue l'export.
   * Variant: 'sintetico' = preventivo cliente, 'completo' = preventivo cantiere/tecnico.
   */
  const handleExportOffer = async (variant: 'sintetico' | 'completo') => {
    if (isExportingRDA) return;
    setIsExportingRDA(true);
    try {
      // 1. Genera il numero offerta (idempotente: se già esiste lo ritorna)
      let offerNumber = estimate.offerNumber as string | null | undefined;
      let issuedAt = estimate.offerIssuedAt as Date | null | undefined;
      if (!offerNumber) {
        const info = await generateOfferNumber.mutateAsync(estimate.id);
        offerNumber = info.offer_number;
        issuedAt = new Date();
      }
      const enrichedEstimate = {
        ...estimate,
        offerNumber: offerNumber ?? null,
        offerIssuedAt: issuedAt ?? new Date(),
      };

      // 2. Carica il modulo dinamicamente (code splitting)
      const exp = await import('@/utils/export');
      if (variant === 'sintetico') {
        await exp.exportSyntheticOffer({
          estimate: enrichedEstimate,
          stratigraphies,
          org: orgProfile ?? null,
        });
      } else {
        await exp.exportCompleteRDA(enrichedEstimate, stratigraphies, orgProfile ?? null);
      }
      toast({
        title: `Preventivo ${variant === 'sintetico' ? 'Sintetico' : 'Completo'} generato`,
        description: offerNumber
          ? `Numero offerta: ${offerNumber}`
          : 'Documento scaricato',
      });
    } catch (error) {
      console.error('Errore export preventivo:', error);
      Sentry.captureException(error, {
        tags: { feature: 'export-offer', variant },
        extra: {
          estimateId: estimate?.id,
          stratigraphyCount: stratigraphies?.length,
        },
      });
      const errMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Errore generazione preventivo',
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isExportingRDA}
              >
                <FileStack className="h-4 w-4" />
                {isExportingRDA ? 'Generando...' : 'Genera preventivo'}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Scegli il formato del preventivo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportOffer('sintetico')}>
                <FileText className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Preventivo Sintetico</span>
                  <span className="text-xs text-muted-foreground">
                    Per il cliente · 2-3 pagine · prezzi finali + IVA
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportOffer('completo')}>
                <FileStack className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Preventivo Completo</span>
                  <span className="text-xs text-muted-foreground">
                    Per il cantiere · composizione + acquisti + tutto
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ExportDropdown estimate={estimate} stratigraphies={stratigraphies} />
        </div>
      </div>
    </div>
  );
};

export default EstimateHeader;
