import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimate } from '@/hooks/useEstimate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Lock } from 'lucide-react';

interface EstimateContextBannerProps {
  estimateId: string;
}

/**
 * Banda informativa mostrata quando il configuratore V2 è aperto con
 * `?estimate=xyz`. Comunica all'utente che sta lavorando dentro il contesto
 * di un preventivo specifico, e offre un back button per tornarci.
 */
const EstimateContextBanner: React.FC<EstimateContextBannerProps> = ({ estimateId }) => {
  const navigate = useNavigate();
  const { estimate, isLoading } = useEstimate(estimateId);

  if (isLoading || !estimate) {
    return null;
  }

  const isContracted = (estimate as any).status === 'contracted';
  const projectName = (estimate as any).projectName ?? (estimate as any).project_name;
  const estimateName = (estimate as any).name;

  return (
    <Card className="px-4 py-3 mx-6 mt-4 mb-2 bg-blue-50/60 border-blue-200/80 flex items-center gap-3">
      <FileText className="h-4 w-4 text-blue-700 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-blue-700/80 font-semibold">
          Stai aggiungendo a un preventivo
        </div>
        <div className="text-sm text-zinc-900 truncate flex items-center gap-2">
          <span className="font-medium">
            {projectName ? `${projectName} — ${estimateName}` : estimateName}
          </span>
          {isContracted && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 gap-1">
              <Lock className="h-2.5 w-2.5" />
              Contrattualizzato
            </Badge>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate(`/estimates/${estimateId}`)}
        className="text-blue-700 hover:bg-blue-100"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Torna al preventivo
      </Button>
    </Card>
  );
};

export default EstimateContextBanner;
