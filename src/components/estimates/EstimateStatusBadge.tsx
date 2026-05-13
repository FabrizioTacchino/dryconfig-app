import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type EstimateStatus =
  | 'draft' | 'sent' | 'won' | 'lost'
  // Legacy values: mantenuti per visualizzare correttamente i preventivi pre-F30
  | 'pending' | 'approved' | 'contracted';

interface EstimateStatusBadgeProps {
  status: EstimateStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Badge stato preventivo (F30).
 *
 * Workflow corrente: Bozza → Inviato → (Vinto | Perso).
 * I valori pending/approved/contracted sono legacy e vengono mappati ai colori
 * piu` vicini per garantire una visualizzazione coerente ai vecchi preventivi
 * che potrebbero non essere stati ancora migrati lato UI.
 */
const EstimateStatusBadge: React.FC<EstimateStatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const config: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Bozza', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    sent: { label: 'Inviato', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    won: { label: 'Vinto', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    lost: { label: 'Perso', cls: 'bg-red-100 text-red-800 border-red-200' },
    // Legacy
    pending: { label: 'Inviato', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    approved: { label: 'Vinto', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    contracted: { label: 'Vinto', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  };
  const { label, cls } = config[status] ?? { label: status, cls: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
  const sizeCls = size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5';
  return (
    <Badge variant="outline" className={cn(cls, sizeCls, className)}>
      {label}
    </Badge>
  );
};

export default EstimateStatusBadge;
