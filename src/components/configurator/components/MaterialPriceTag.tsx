import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown } from 'lucide-react';

interface MaterialPriceTagProps {
  /** Prezzo netto (es. material.unit_price). */
  netPrice: number | null | undefined;
  /** Prezzo da listino (es. material.list_price). Se null o uguale al netto, non viene mostrato. */
  listPrice?: number | null;
  /** Unità di misura, es. 'mq', 'ml', 'pz'. */
  unit?: string | null;
  /** 'compact' = una sola riga, ideale per liste; 'full' = mostra anche il risparmio percentuale. */
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * Mostra il prezzo netto in evidenza, con il prezzo di listino barrato e
 * la percentuale di sconto applicata. Quando non c'è sconto mostra solo il netto.
 */
export const MaterialPriceTag: React.FC<MaterialPriceTagProps> = ({
  netPrice,
  listPrice,
  unit = 'mq',
  variant = 'compact',
  className = '',
}) => {
  if (netPrice == null) {
    return <span className={`text-muted-foreground text-xs ${className}`}>—</span>;
  }

  const hasDiscount =
    listPrice != null && Number.isFinite(listPrice) && listPrice > netPrice + 0.001;

  const discountPct = hasDiscount && listPrice! > 0
    ? ((1 - netPrice / listPrice!) * 100)
    : 0;

  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-start gap-0.5 ${className}`}>
        <div className="inline-flex items-center gap-2">
          <span className="font-semibold text-green-700 text-base">
            €{netPrice.toFixed(2)}
            <span className="text-xs text-green-700/70">/{unit ?? 'mq'}</span>
          </span>
          {hasDiscount && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1 py-0">
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              {discountPct.toFixed(1)}%
            </Badge>
          )}
        </div>
        {hasDiscount && (
          <span className="text-[11px] text-muted-foreground">
            Listino <span className="line-through">€{listPrice!.toFixed(2)}</span>
          </span>
        )}
      </div>
    );
  }

  // compact (default)
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Badge variant="outline" className="bg-green-50 text-green-700 text-xs px-1.5 py-0">
        €{netPrice.toFixed(2)}/{unit ?? 'mq'}
      </Badge>
      {hasDiscount && (
        <span className="text-[10px] text-muted-foreground">
          <span className="line-through">€{listPrice!.toFixed(2)}</span>
          <span className="ml-0.5 text-green-700">−{discountPct.toFixed(0)}%</span>
        </span>
      )}
    </div>
  );
};

export default MaterialPriceTag;
