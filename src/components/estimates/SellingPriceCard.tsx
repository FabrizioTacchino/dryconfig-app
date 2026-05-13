import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrgProfile } from '@/hooks/useOrgSettings';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { applyPricing, type CostBase } from '@/utils/pricing/applyPricing';
import type { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { Link } from 'react-router-dom';

interface SellingPriceCardProps {
  stratigraphies: (EstimateStratigraphy & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stratigraphy?: any;
  })[];
}

function euro(v: number): string {
  return `€ ${v.toFixed(2).replace('.', ',')}`;
}

function num(v: unknown, fb = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

/**
 * Card "Vista vendita" per il preventivo (F29).
 *
 * Mostra il breakdown completo costo → prezzo vendita applicando la pipeline
 * di pricing dell'organization (markup, accessori, sconto, IVA). Visibile
 * SOLO a owner/admin: i ruoli operativi vedono solo i prezzi finali al cliente
 * nei PDF, non il dettaglio del margine.
 */
const SellingPriceCard: React.FC<SellingPriceCardProps> = ({ stratigraphies }) => {
  const { currentRole } = useCurrentOrganization();
  const canSeeMargins = currentRole === 'owner' || currentRole === 'admin';
  const { data: org } = useOrgProfile();
  const [showDetails, setShowDetails] = React.useState(true);

  const costBase = useMemo<CostBase>(() => {
    let materials = 0;
    let labor = 0;
    let finish = 0;
    let totalArea = 0;
    for (const s of stratigraphies) {
      const area = num(s.area, 0);
      totalArea += area;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inner = (s as any).stratigraphy ?? {};
      materials += (num(inner.material_cost_per_sqm) + num(inner.screw_cost_per_sqm)) * area;
      labor += num(inner.labor_cost_per_sqm) * area;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (s as any).finishCostPerSqm;
      if (f != null) finish += num(f) * area;
    }
    return { materials, labor, finish, totalArea };
  }, [stratigraphies]);

  const breakdown = useMemo(() => applyPricing(costBase, org ?? null), [costBase, org]);

  if (!canSeeMargins) {
    // Per gli altri ruoli non mostriamo neanche la card (informazioni gestionali sensibili).
    return null;
  }

  if (stratigraphies.length === 0) return null;

  const margin = breakdown.netPrice - breakdown.costBase;
  const marginPct = breakdown.costBase > 0 ? (margin / breakdown.costBase) * 100 : 0;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Vista vendita (gestionale)
                <Badge variant="secondary" className="text-xs">Interno</Badge>
              </CardTitle>
              <CardDescription>
                Pipeline costo → prezzo cliente. Visibile solo a owner/admin.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(s => !s)}
            className="gap-1"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'Nascondi' : 'Mostra'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Highlight bar in alto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Costo base</p>
            <p className="text-lg font-bold">{euro(breakdown.costBase)}</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Prezzo netto (imp.)</p>
            <p className="text-lg font-bold text-primary">{euro(breakdown.netPrice)}</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Margine</p>
            <p className="text-lg font-bold text-green-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {euro(margin)}
              <span className="text-xs font-normal text-muted-foreground">
                ({marginPct.toFixed(0)}%)
              </span>
            </p>
          </div>
          <div className="rounded-md border bg-primary p-3 text-primary-foreground">
            <p className="text-xs opacity-80">Totale IVA inclusa</p>
            <p className="text-lg font-bold">{euro(breakdown.totalPrice)}</p>
          </div>
        </div>

        {/* Pipeline dettagliata */}
        {showDetails && (
          <div className="text-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2">
              {/* Costi diretti */}
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  Costi diretti (interno)
                </h4>
                <div className="flex justify-between">
                  <span>Materiali + viti</span>
                  <span className="font-mono">{euro(breakdown.costMaterials)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manodopera</span>
                  <span className="font-mono">{euro(breakdown.costLabor)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Finitura</span>
                  <span className="font-mono">{euro(breakdown.costFinish)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Costo base totale</span>
                  <span className="font-mono">{euro(breakdown.costBase)}</span>
                </div>
              </div>

              {/* Mark-up */}
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  Mark-up applicati
                </h4>
                <div className="flex justify-between">
                  <span>Su materiali ({org?.markup_materials_pct ?? 25}%)</span>
                  <span className="font-mono">+ {euro(breakdown.markupMaterials)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Su manodopera ({org?.markup_labor_pct ?? 70}%)</span>
                  <span className="font-mono">+ {euro(breakdown.markupLabor)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Su finitura ({org?.markup_finish_pct ?? 30}%)</span>
                  <span className="font-mono">+ {euro(breakdown.markupFinish)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Margine industriale</span>
                  <span className="font-mono text-green-600">+ {euro(breakdown.markupTotal)}</span>
                </div>
              </div>

              {/* Accessori */}
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  Costi accessori
                </h4>
                <div className="flex justify-between">
                  <span>Spese generali ({org?.overhead_pct ?? 10}%)</span>
                  <span className="font-mono">+ {euro(breakdown.overhead)}</span>
                </div>
                {breakdown.safety > 0 && (
                  <div className="flex justify-between">
                    <span>Sicurezza ({org?.safety_pct ?? 0}%)</span>
                    <span className="font-mono">+ {euro(breakdown.safety)}</span>
                  </div>
                )}
                {breakdown.transport > 0 && (
                  <div className="flex justify-between">
                    <span>Trasporto</span>
                    <span className="font-mono">+ {euro(breakdown.transport)}</span>
                  </div>
                )}
                {breakdown.disposal > 0 && (
                  <div className="flex justify-between">
                    <span>Smaltimento</span>
                    <span className="font-mono">+ {euro(breakdown.disposal)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Totale accessori</span>
                  <span className="font-mono">+ {euro(breakdown.accessoriesTotal)}</span>
                </div>
              </div>

              {/* Sconto + IVA */}
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  Sconto cliente & IVA
                </h4>
                <div className="flex justify-between">
                  <span>Prezzo lordo</span>
                  <span className="font-mono">{euro(breakdown.grossPrice)}</span>
                </div>
                {breakdown.customerDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Sconto cliente ({breakdown.customerDiscountPct}%)</span>
                    <span className="font-mono">− {euro(breakdown.customerDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Imponibile</span>
                  <span className="font-mono">{euro(breakdown.netPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({breakdown.ivaPct}%)</span>
                  <span className="font-mono">+ {euro(breakdown.ivaAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-primary">
                  <span>Totale offerta</span>
                  <span className="font-mono">{euro(breakdown.totalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
              Configura mark-up, accessori, IVA e sconti in{' '}
              <Link to="/settings/organization" className="underline hover:text-foreground">
                Settings → Organizzazione
              </Link>
              . Il prezzo finale al cliente nel PDF e` <strong>{euro(breakdown.totalPrice)}</strong>
              {' '}({euro(costBase.totalArea > 0 ? breakdown.netPrice / costBase.totalArea : 0)}/m² IVA esclusa).
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SellingPriceCard;
