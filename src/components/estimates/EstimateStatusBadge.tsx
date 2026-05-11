import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type EstimateStatus = 'draft' | 'pending' | 'approved' | 'contracted';

interface EstimateStatusBadgeProps {
  status: EstimateStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Badge stato preventivo riusabile, allineato al workflow:
 * draft → pending → approved → contracted.
 */
const EstimateStatusBadge: React.FC<EstimateStatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const config: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Bozza', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    pending: { label: 'In attesa', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    approved: { label: 'Approvato', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    contracted: { label: 'Contrattualizzato', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
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
