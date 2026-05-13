
import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWasteFactors } from '@/hooks/useWasteFactors';

/**
 * Periodi disponibili per il filtro dashboard. Filtrano le metriche di
 * "flusso" (preventivi creati nel periodo, valore vinto nel periodo, ecc.).
 * Le metriche di "stato corrente" (progetti attivi, fornitori in anagrafica)
 * non sono filtrate dal periodo.
 */
export type DashboardPeriod = '1m' | '3m' | '6m' | '12m' | 'ytd' | 'all';

export interface DashboardMetrics {
  // Project metrics (stato corrente, non filtrato)
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  archivedProjects: number;

  // Estimate metrics (filtrate da periodo)
  totalEstimates: number;
  draftEstimates: number;
  pendingEstimates: number;    // F30: include sent + legacy pending
  approvedEstimates: number;   // legacy
  contractedEstimates: number; // F30: include won + legacy contracted
  /** F30: preventivi marcati come Persi nel periodo. */
  lostEstimates: number;

  // Financial metrics
  totalValue: number;
  contractedValue: number;     // vinti + legacy contracted
  pendingValue: number;        // inviati ancora aperti = pipeline aperta
  /** F30: valore preventivi persi (per analisi "quanto valeva quello che ci è sfuggito"). */
  lostValue: number;
  averageEstimateValue: number;
  /** Conversion rate vinti / (vinti + persi) — escludi i preventivi ancora in pipeline. */
  conversionRate: number;
  /** F30: giorni medi tra sent_at e won_at/lost_at sui preventivi chiusi nel periodo. */
  avgDaysToClose: number;
  /** Aggregazione motivi perdita F30. */
  lostReasonsBreakdown: Array<{ reason: string; count: number; value: number }>;

  // Materials metrics
  totalMaterialsCost: number;
  totalLaborCost: number;
  totalSurfaceArea: number;
  averageCostPerSqm: number;

  // Operational metrics
  wastePercentage: number;
  disposalPercentage: number;
  avgInstallationTime: number;

  // Supplier breakdown
  supplierBreakdown: Array<{
    supplier: string;
    totalCost: number;
    percentage: number;
  }>;

  // Material category breakdown
  categoryBreakdown: Array<{
    category: string;
    totalCost: number;
    percentage: number;
    items: number;
  }>;

  // Monthly trends (ultimi 12 mesi indipendentemente dal filtro periodo)
  monthlyTrends: Array<{
    month: string;
    projects: number;
    estimates: number;
    /** Valore totale preventivi creati nel mese (somma totalAmount). */
    value: number;
    /** F30: valore preventivi *vinti* nel mese (somma vinti). */
    wonValue: number;
    area: number;
  }>;

  /** F16: top 5 stratigrafie più usate (per numero di volte aggiunte ai preventivi). */
  topStratigraphies: Array<{
    name: string;
    usedCount: number;
    totalArea: number;
    totalValue: number;
  }>;

  /**
   * F16: alert preventivi "stale" — inviati da più di N giorni senza chiusura.
   * Default soglia 30 giorni (recuperabile in futuro da org_settings).
   */
  staleEstimates: Array<{
    id: string;
    name: string;
    daysSinceSent: number;
    totalAmount: number;
  }>;
}

/**
 * Converte un periodo nella data di cutoff. `null` = nessun filtro.
 */
function periodToCutoff(period: DashboardPeriod): Date | null {
  const now = new Date();
  if (period === 'all') return null;
  if (period === 'ytd') {
    return new Date(now.getFullYear(), 0, 1);
  }
  const monthMap: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
  const months = monthMap[period];
  if (!months) return null;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff;
}

const LOST_REASON_LABELS: Record<string, string> = {
  price: 'Prezzo troppo alto',
  timing: 'Tempi non compatibili',
  competitor: 'Concorrente scelto',
  no_response: 'Nessuna risposta',
  other: 'Altro motivo',
};

export const useDashboardData = (period: DashboardPeriod = '6m') => {
  const { wasteMap } = useWasteFactors();
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();

  // Fetch comprehensive estimate data (include F30 timestamps + customer_id via projects)
  const { data: estimatesData = [], isLoading: estimatesLoading } = useQuery({
    queryKey: ['dashboard-estimates-comprehensive', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id);

      if (!userProjects?.length) return [];

      const projectIds = userProjects.map(p => p.id);

      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          projects ( id, name, customer_id ),
          estimate_stratigraphies (
            *,
            stratigraphy_data
          )
        `)
        .in('project_id', projectIds);

      if (error) {
        console.error('Error fetching comprehensive estimates:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });

  // F24: customers per top-clienti
  const { data: customersData = [] } = useQuery({
    queryKey: ['dashboard-customers', user?.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from('customers' as any)
        .select('id, name, city');
      if (error) {
        console.warn('[dashboard] Failed to fetch customers:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch materials data for analysis
  const { data: materialsData = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['dashboard-materials', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*');

      if (error) throw error;
      return data || [];
    },
  });

  const dashboardMetrics = useMemo((): DashboardMetrics => {
    const cutoff = periodToCutoff(period);
    const inPeriod = (d: string | null | undefined): boolean => {
      if (!cutoff) return true;
      if (!d) return false;
      return new Date(d) >= cutoff;
    };

    // ============== PROGETTI (stato corrente, non filtrato) ==============
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const archivedProjects = projects.filter(p => p.status === 'archived').length;

    // ============== PREVENTIVI (filtrati per periodo su created_at) ==============
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredEstimates = (estimatesData as any[]).filter(e => inPeriod(e.created_at));

    const draftEstimates = filteredEstimates.filter(e => e.status === 'draft').length;
    const pendingEstimates = filteredEstimates.filter(
      e => e.status === 'sent' || e.status === 'pending',
    ).length;
    const approvedEstimates = filteredEstimates.filter(e => e.status === 'approved').length;
    const contractedEstimates = filteredEstimates.filter(
      e => e.status === 'won' || e.status === 'contracted',
    ).length;
    const lostEstimates = filteredEstimates.filter(e => e.status === 'lost').length;

    // ============== METRICHE FINANZIARIE ==============
    const num = (v: unknown): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const totalValue = filteredEstimates.reduce((sum, e) => sum + num(e.total_amount), 0);
    const contractedValue = filteredEstimates
      .filter(e => e.status === 'won' || e.status === 'contracted')
      .reduce((sum, e) => sum + num(e.total_amount), 0);
    const pendingValue = filteredEstimates
      .filter(e => e.status === 'sent' || e.status === 'pending' || e.status === 'approved')
      .reduce((sum, e) => sum + num(e.total_amount), 0);
    const lostValue = filteredEstimates
      .filter(e => e.status === 'lost')
      .reduce((sum, e) => sum + num(e.total_amount), 0);

    // Conversion rate: solo sui preventivi *chiusi* (vinti + persi).
    // Esclude la pipeline ancora aperta che non ha esito definito.
    const closedCount = contractedEstimates + lostEstimates;
    const conversionRate = closedCount > 0
      ? (contractedEstimates / closedCount) * 100
      : 0;

    // ============== F30: TEMPO MEDIO CHIUSURA ==============
    // Per i preventivi chiusi (won/lost) nel periodo, calcoliamo giorni tra
    // sent_at e won_at/lost_at. Se sent_at è NULL (transizione diretta
    // draft→won/lost senza passare da sent) usiamo created_at.
    const closedEstimates = filteredEstimates.filter(
      e => e.status === 'won' || e.status === 'lost' || e.status === 'contracted',
    );
    let totalClosingDays = 0;
    let closingCount = 0;
    for (const e of closedEstimates) {
      const start = e.sent_at ? new Date(e.sent_at) : new Date(e.created_at);
      const end = e.won_at
        ? new Date(e.won_at)
        : e.lost_at
        ? new Date(e.lost_at)
        : null;
      if (!end) continue;
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 0) {
        totalClosingDays += days;
        closingCount++;
      }
    }
    const avgDaysToClose = closingCount > 0 ? totalClosingDays / closingCount : 0;

    // ============== F30: MOTIVI PERDITA ==============
    const lostReasonsMap = new Map<string, { count: number; value: number }>();
    for (const e of filteredEstimates.filter(x => x.status === 'lost')) {
      const reason = (e.lost_reason as string) || 'other';
      const existing = lostReasonsMap.get(reason) || { count: 0, value: 0 };
      lostReasonsMap.set(reason, {
        count: existing.count + 1,
        value: existing.value + num(e.total_amount),
      });
    }
    const lostReasonsBreakdown = Array.from(lostReasonsMap.entries())
      .map(([reason, data]) => ({
        reason: LOST_REASON_LABELS[reason] || reason,
        count: data.count,
        value: data.value,
      }))
      .sort((a, b) => b.count - a.count);

    // ============== MATERIALI / OPERATIVI ==============
    let totalMaterialsCost = 0;
    let totalLaborCost = 0;
    let totalSurfaceArea = 0;
    let totalWastePercentage = 0;
    let totalDisposalPercentage = 0;
    let totalInstallationTime = 0;
    let stratigraphyCount = 0;

    const supplierCosts = new Map<string, number>();
    const categoryCosts = new Map<string, { cost: number; items: number }>();
    // F16: aggregazione stratigrafie per nome (top usate)
    const stratigraphyUseMap = new Map<string, { count: number; area: number; value: number }>();

    filteredEstimates.forEach(estimate => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (estimate.estimate_stratigraphies as any[] | null)?.forEach((strati) => {
        totalSurfaceArea += num(strati.area);
        stratigraphyCount++;

        // Top stratigrafie per uso
        const stratName = strati.name || 'Senza nome';
        const ex = stratigraphyUseMap.get(stratName) ?? { count: 0, area: 0, value: 0 };
        stratigraphyUseMap.set(stratName, {
          count: ex.count + 1,
          area: ex.area + num(strati.area),
          value: ex.value + num(strati.total_cost),
        });

        if (strati.stratigraphy_data && typeof strati.stratigraphy_data === 'object' && 'layers' in strati.stratigraphy_data) {
          const stratigraphyDataObj = strati.stratigraphy_data as { layers?: unknown[] };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stratigraphyDataObj.layers?.forEach((layer: any) => {
            if (layer.materials) {
              const material = layer.materials;
              const layerCost = num(material.unit_price) * num(strati.area) * num(material.incidence_per_sqm || 1);

              totalMaterialsCost += layerCost;

              const supplier = material.supplier || 'Non specificato';
              supplierCosts.set(supplier, (supplierCosts.get(supplier) || 0) + layerCost);

              const category = material.category || 'Altri';
              const current = categoryCosts.get(category) || { cost: 0, items: 0 };
              categoryCosts.set(category, {
                cost: current.cost + layerCost,
                items: current.items + 1,
              });

              const wasteOverride = material.waste_percentage;
              const resolvedWaste = (wasteOverride !== null && wasteOverride !== undefined)
                ? Number(wasteOverride)
                : (wasteMap[material.category ?? ''] ?? 0);
              totalWastePercentage += resolvedWaste;
              totalDisposalPercentage += material.disposal_percentage || 4;
              totalInstallationTime += material.installation_time_per_sqm || 0;
            }

            if (layer.labor_cost_per_sqm) {
              totalLaborCost += layer.labor_cost_per_sqm * num(strati.area);
            }
          });
        }
      });
    });

    // Supplier breakdown
    const totalSupplierCost = Array.from(supplierCosts.values()).reduce((sum, c) => sum + c, 0);
    const supplierBreakdown = Array.from(supplierCosts.entries())
      .map(([supplier, cost]) => ({
        supplier,
        totalCost: cost,
        percentage: totalSupplierCost > 0 ? (cost / totalSupplierCost) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Category breakdown
    const totalCategoryCost = Array.from(categoryCosts.values()).reduce((sum, item) => sum + item.cost, 0);
    const categoryBreakdown = Array.from(categoryCosts.entries())
      .map(([category, data]) => ({
        category,
        totalCost: data.cost,
        percentage: totalCategoryCost > 0 ? (data.cost / totalCategoryCost) * 100 : 0,
        items: data.items,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Top stratigrafie (top 5 per count)
    const topStratigraphies = Array.from(stratigraphyUseMap.entries())
      .map(([name, data]) => ({
        name,
        usedCount: data.count,
        totalArea: data.area,
        totalValue: data.value,
      }))
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5);

    // ============== MONTHLY TRENDS (ultimi 12 mesi, NON filtrati da periodo) ==============
    // I trends mostrano sempre l'andamento storico, indipendentemente dal
    // filtro periodo. Servono a vedere stagionalità.
    const monthsLabels = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const monthlyTrends: DashboardMetrics['monthlyTrends'] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthProjects = projects.filter(p => {
        const c = new Date(p.createdAt);
        return c >= monthStart && c <= monthEnd;
      }).length;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monthEstimates = (estimatesData as any[]).filter(e => {
        const c = new Date(e.created_at);
        return c >= monthStart && c <= monthEnd;
      });

      const value = monthEstimates.reduce((s, e) => s + num(e.total_amount), 0);
      const area = monthEstimates.reduce((s, e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return s + ((e.estimate_stratigraphies as any[] | null)?.reduce((a, x) => a + num(x.area), 0) || 0);
      }, 0);
      // wonValue = somma totalAmount dei preventivi *vinti* in quel mese (basato su won_at o created_at)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wonInMonth = (estimatesData as any[]).filter(e => {
        if (e.status !== 'won' && e.status !== 'contracted') return false;
        const winDate = e.won_at ? new Date(e.won_at) : new Date(e.updated_at || e.created_at);
        return winDate >= monthStart && winDate <= monthEnd;
      });
      const wonValue = wonInMonth.reduce((s, e) => s + num(e.total_amount), 0);

      monthlyTrends.push({
        month: monthsLabels[monthStart.getMonth()],
        projects: monthProjects,
        estimates: monthEstimates.length,
        value,
        wonValue,
        area,
      });
    }

    // ============== F16: STALE ESTIMATES ALERT ==============
    // Preventivi inviati da > 30 giorni senza chiusura (rimasti in stato sent/pending).
    const STALE_THRESHOLD_DAYS = 30;
    const nowMs = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const staleEstimates = (estimatesData as any[])
      .filter(e => e.status === 'sent' || e.status === 'pending')
      .map(e => {
        const sentDate = e.sent_at ? new Date(e.sent_at) : new Date(e.updated_at || e.created_at);
        const daysSinceSent = (nowMs - sentDate.getTime()) / (1000 * 60 * 60 * 24);
        return {
          id: e.id as string,
          name: (e.name as string) || 'Preventivo',
          daysSinceSent,
          totalAmount: num(e.total_amount),
        };
      })
      .filter(e => e.daysSinceSent >= STALE_THRESHOLD_DAYS)
      .sort((a, b) => b.daysSinceSent - a.daysSinceSent)
      .slice(0, 10);

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      archivedProjects,

      totalEstimates: filteredEstimates.length,
      draftEstimates,
      pendingEstimates,
      approvedEstimates,
      contractedEstimates,
      lostEstimates,

      totalValue,
      contractedValue,
      pendingValue,
      lostValue,
      averageEstimateValue: filteredEstimates.length > 0 ? totalValue / filteredEstimates.length : 0,
      conversionRate,
      avgDaysToClose,
      lostReasonsBreakdown,

      totalMaterialsCost,
      totalLaborCost,
      totalSurfaceArea,
      averageCostPerSqm: totalSurfaceArea > 0 ? (totalMaterialsCost + totalLaborCost) / totalSurfaceArea : 0,

      wastePercentage: stratigraphyCount > 0 ? totalWastePercentage / stratigraphyCount : 0,
      disposalPercentage: stratigraphyCount > 0 ? totalDisposalPercentage / stratigraphyCount : 0,
      avgInstallationTime: stratigraphyCount > 0 ? totalInstallationTime / stratigraphyCount : 0,

      supplierBreakdown,
      categoryBreakdown,
      monthlyTrends,

      topStratigraphies,
      staleEstimates,
    };
  }, [projects, estimatesData, materialsData, wasteMap, period]);

  // F16: top customers — calcolo separato per non gonfiare il useMemo principale
  const topCustomers = useMemo(() => {
    const cutoff = periodToCutoff(period);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, { name: string; city: string | null; totalWon: number; count: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const e of (estimatesData as any[])) {
      if (cutoff) {
        const created = new Date(e.created_at);
        if (created < cutoff) continue;
      }
      const isWon = e.status === 'won' || e.status === 'contracted';
      if (!isWon) continue;
      const customerId: string | null = e.projects?.customer_id ?? null;
      if (!customerId) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cust = (customersData as any[]).find(c => c.id === customerId);
      if (!cust) continue;
      const ex = map.get(customerId) ?? { name: cust.name, city: cust.city, totalWon: 0, count: 0 };
      ex.totalWon += Number(e.total_amount ?? 0);
      ex.count += 1;
      map.set(customerId, ex);
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalWon - a.totalWon)
      .slice(0, 5);
  }, [estimatesData, customersData, period]);

  return {
    dashboardMetrics,
    topCustomers,
    isLoading: projectsLoading || estimatesLoading || materialsLoading,
    projects,
    estimatesData,
    materialsData,
  };
};
