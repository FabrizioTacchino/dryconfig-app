/**
 * Dashboard "wow-grade" (F16).
 *
 * Vista commerciale + operativa pensata per il titolare di una impresa di
 * cartongesso. Mostra in un colpo d'occhio:
 *   - Pipeline preventivi (Bozza → Inviato → Vinto/Perso, F30)
 *   - Conversion rate + tempo medio chiusura
 *   - Trend mensile valore vinto vs preventivato (ultimi 12m)
 *   - Top clienti & top stratigrafie del periodo selezionato
 *   - Alert preventivi inviati > 30gg senza risposta
 *   - Breakdown materiali per categoria/fornitore
 *   - Filtro periodo applicato a tutte le metriche di "flusso"
 *
 * Per le metriche di stato corrente (progetti attivi, fornitori in
 * anagrafica) il filtro periodo non si applica — il dato è "ora".
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line,
} from 'recharts';
import {
  TrendingUp, Users, FileText, Euro, Clock, Package, Wrench, AlertTriangle,
  Target, Factory, Trophy, XCircle, Send, FileEdit, Calendar, Percent,
  ArrowRight, Layers,
} from 'lucide-react';

import { useDashboardData, type DashboardPeriod } from '@/hooks/useDashboardData';
import { DashboardCard } from './DashboardCard';
import { MaterialsBreakdownCard } from './MaterialsBreakdownCard';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { AnimatedProgress } from '@/components/ui/animated-progress';

const COLORS = ['#1E5091', '#3478BE', '#5696D7', '#84B4E5', '#A8C5E8', '#CCE0F0'];
const FUNNEL_COLORS = {
  draft: '#94a3b8',    // slate-400
  sent: '#f59e0b',     // amber-500
  won: '#10b981',      // emerald-500
  lost: '#ef4444',     // red-500
};

function euro(n: number): string {
  return `€ ${Math.round(n).toLocaleString('it-IT')}`;
}

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  '1m': 'Ultimo mese',
  '3m': 'Ultimi 3 mesi',
  '6m': 'Ultimi 6 mesi',
  '12m': 'Ultimi 12 mesi',
  'ytd': 'Da inizio anno',
  'all': 'Tutto lo storico',
};

export const EnhancedDashboardOverview = () => {
  const [period, setPeriod] = useState<DashboardPeriod>('6m');
  const { dashboardMetrics: m, topCustomers, isLoading } = useDashboardData(period);

  if (isLoading || !m) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasAnyEstimate = m.totalEstimates > 0;
  const funnelData = [
    { name: 'Bozze', value: m.draftEstimates, fill: FUNNEL_COLORS.draft },
    { name: 'Inviati', value: m.pendingEstimates, fill: FUNNEL_COLORS.sent },
    { name: 'Vinti', value: m.contractedEstimates, fill: FUNNEL_COLORS.won },
    { name: 'Persi', value: m.lostEstimates, fill: FUNNEL_COLORS.lost },
  ];

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER + FILTRO PERIODO
          ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panoramica</h2>
          <p className="text-sm text-muted-foreground">
            Dati del periodo: <span className="font-medium">{PERIOD_LABELS[period]}</span>
            {' · '}
            <span className="text-xs">i valori "in corso" (es. progetti attivi) sono sempre in tempo reale</span>
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABELS) as DashboardPeriod[]).map(p => (
              <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ============================================================
          HERO ROW — 6 KPI COMMERCIALI
          ============================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardCard
          title="Vinti nel periodo"
          value={<AnimatedCounter value={m.contractedValue} prefix="€ " decimals={0} />}
          description={`${m.contractedEstimates} preventivi confermati`}
          icon={<Trophy className="text-emerald-600" />}
          className="border-emerald-200/50 bg-gradient-to-br from-emerald-50/60 to-background"
        />

        <DashboardCard
          title="Pipeline aperta"
          value={<AnimatedCounter value={m.pendingValue} prefix="€ " decimals={0} />}
          description={`${m.pendingEstimates} preventivi in attesa risposta`}
          icon={<Send className="text-amber-600" />}
          className="border-amber-200/50 bg-gradient-to-br from-amber-50/60 to-background"
        />

        <DashboardCard
          title="Conversion rate"
          value={<AnimatedCounter value={m.conversionRate} suffix=" %" decimals={0} />}
          description={`${m.contractedEstimates} vinti su ${m.contractedEstimates + m.lostEstimates} chiusi`}
          icon={<Percent className="text-blue-600" />}
          change={{
            value: m.conversionRate - 50,
            type: m.conversionRate >= 50 ? 'positive' : m.conversionRate >= 30 ? 'neutral' : 'negative',
            label: 'vs 50%',
          }}
        />

        <DashboardCard
          title="Tempo medio chiusura"
          value={<AnimatedCounter value={m.avgDaysToClose} suffix=" gg" decimals={0} />}
          description="Giorni da invio a vinto/perso"
          icon={<Clock className="text-indigo-600" />}
        />

        <DashboardCard
          title="Valore medio offerta"
          value={<AnimatedCounter value={m.averageEstimateValue} prefix="€ " decimals={0} />}
          description={`Su ${m.totalEstimates} preventivi`}
          icon={<TrendingUp className="text-purple-600" />}
        />

        <DashboardCard
          title="Persi nel periodo"
          value={<AnimatedCounter value={m.lostValue} prefix="€ " decimals={0} />}
          description={`${m.lostEstimates} preventivi non andati a buon fine`}
          icon={<XCircle className="text-red-600" />}
          className="border-red-200/50 bg-gradient-to-br from-red-50/60 to-background"
        />
      </div>

      {/* ============================================================
          ALERT: PREVENTIVI INVIATI > 30 GG SENZA RISPOSTA
          ============================================================ */}
      {m.staleEstimates.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/40 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">
                  {m.staleEstimates.length} preventivi senza risposta da oltre 30 giorni
                </CardTitle>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
                {euro(m.staleEstimates.reduce((s, e) => s + e.totalAmount, 0))} totali
              </Badge>
            </div>
            <CardDescription>
              Considera di richiamare il cliente o segnare come perso per ripulire la pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              {m.staleEstimates.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-amber-100/50">
                  <span className="font-medium truncate">{e.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-amber-800 text-xs">
                      {Math.floor(e.daysSinceSent)} giorni fa
                    </span>
                    <span className="font-mono text-xs">{euro(e.totalAmount)}</span>
                  </div>
                </div>
              ))}
              {m.staleEstimates.length > 5 && (
                <div className="text-xs text-muted-foreground pt-1">
                  + altri {m.staleEstimates.length - 5} preventivi stale
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================
          STATO IMPRESA (sempre live, non filtrato da periodo)
          ============================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Progetti attivi"
          value={<AnimatedCounter value={m.activeProjects} />}
          description={`${m.totalProjects} totali · ${m.completedProjects} completati`}
          icon={<Users />}
        />
        <DashboardCard
          title="Bozze in lavorazione"
          value={<AnimatedCounter value={m.draftEstimates} />}
          description="Preventivi mai inviati al cliente"
          icon={<FileEdit />}
        />
        <DashboardCard
          title="Superficie preventivata"
          value={<AnimatedCounter value={m.totalSurfaceArea} suffix=" m²" decimals={0} />}
          description={`€ ${m.averageCostPerSqm.toFixed(2)}/m² medio`}
          icon={<Target />}
        />
        <DashboardCard
          title="Valore complessivo"
          value={<AnimatedCounter value={m.totalValue} prefix="€ " decimals={0} />}
          description="Tutti i preventivi del periodo"
          icon={<Euro />}
        />
      </div>

      {/* ============================================================
          TABS: PANORAMICA / COMMERCIALE / MATERIALI / OPERATIVO
          ============================================================ */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="sales">Commerciale</TabsTrigger>
          <TabsTrigger value="materials">Materiali & Fornitori</TabsTrigger>
          <TabsTrigger value="operational">Operativo</TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: PANORAMICA ========== */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Sales funnel */}
            <Card className="lg:col-span-2 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Funnel preventivi
                </CardTitle>
                <CardDescription>
                  Distribuzione del periodo per stato workflow F30
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasAnyEstimate ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip
                          formatter={(value: number) => [`${value} preventivi`, '']}
                          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {funnelData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-12 w-12 text-muted-foreground/30" />}
                    title="Nessun preventivo nel periodo"
                    description="Quando inizierai a creare preventivi, vedrai qui il funnel di vendita."
                  />
                )}
              </CardContent>
            </Card>

            {/* Motivi perdita */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Motivi perdita
                </CardTitle>
                <CardDescription>
                  Perché i clienti dicono di no
                </CardDescription>
              </CardHeader>
              <CardContent>
                {m.lostReasonsBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {m.lostReasonsBreakdown.map((r, idx) => (
                      <div key={r.reason} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{r.reason}</span>
                          <span className="text-muted-foreground">{r.count}</span>
                        </div>
                        <AnimatedProgress
                          value={r.count}
                          max={Math.max(...m.lostReasonsBreakdown.map(x => x.count))}
                          color={idx === 0 ? 'error' : 'primary'}
                        />
                        <div className="text-xs text-muted-foreground text-right">
                          {euro(r.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Trophy className="h-12 w-12 text-emerald-300" />}
                    title="Nessun preventivo perso"
                    description="Niente perdite registrate nel periodo. Continua così!"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trend mensile valore (12 mesi) */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Andamento ultimi 12 mesi
                  </CardTitle>
                  <CardDescription>
                    Valore preventivato vs. effettivamente vinto, mese per mese
                  </CardDescription>
                </div>
                <div className="hidden md:flex items-center gap-3 text-xs">
                  <Legendina color="#3478BE" label="Preventivato" />
                  <Legendina color="#10b981" label="Vinto" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={m.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [euro(value), name]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3478BE"
                      fill="#3478BE"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Preventivato"
                    />
                    <Line
                      type="monotone"
                      dataKey="wonValue"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Vinto"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 2: COMMERCIALE ========== */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top clienti */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                  Top 5 clienti per fatturato vinto
                </CardTitle>
                <CardDescription>
                  Chi ti porta più valore nel periodo selezionato
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {topCustomers.map((c, idx) => (
                      <div key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{c.name}</div>
                          {c.city && (
                            <div className="text-xs text-muted-foreground">{c.city}</div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold">{euro(c.totalWon)}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.count} {c.count === 1 ? 'lavoro' : 'lavori'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Users className="h-12 w-12 text-muted-foreground/30" />}
                    title="Ancora nessun cliente vincente"
                    description="Collega i preventivi all'anagrafica clienti per vedere classifica."
                    cta={<Link to="/customers"><Button variant="outline" size="sm">Vai a Clienti <ArrowRight className="h-3 w-3 ml-1" /></Button></Link>}
                  />
                )}
              </CardContent>
            </Card>

            {/* Top stratigrafie */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Top 5 stratigrafie più usate
                </CardTitle>
                <CardDescription>
                  Quali pareti usi più spesso nei preventivi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {m.topStratigraphies.length > 0 ? (
                  <div className="space-y-3">
                    {m.topStratigraphies.map((s, idx) => (
                      <div key={s.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                            <span className="font-medium truncate">{s.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-semibold">{s.usedCount}×</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {s.totalArea.toFixed(0)} m²
                            </span>
                          </div>
                        </div>
                        <AnimatedProgress
                          value={s.usedCount}
                          max={Math.max(...m.topStratigraphies.map(x => x.usedCount))}
                          color="primary"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Layers className="h-12 w-12 text-muted-foreground/30" />}
                    title="Ancora nessuna stratigrafia usata"
                    description="Aggiungi stratigrafie ai tuoi preventivi per popolare questa classifica."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distribuzione preventivi (pie) */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Composizione pipeline</CardTitle>
              <CardDescription>
                Quanti preventivi sono in ciascuno stato del workflow F30
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasAnyEstimate ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={funnelData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={90}
                          dataKey="value"
                        >
                          {funnelData.filter(d => d.value > 0).map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    <FunnelRow label="Bozze" value={m.draftEstimates} color={FUNNEL_COLORS.draft} icon={<FileEdit className="h-4 w-4" />} />
                    <FunnelRow label="Inviati" value={m.pendingEstimates} color={FUNNEL_COLORS.sent} icon={<Send className="h-4 w-4" />} amount={m.pendingValue} />
                    <FunnelRow label="Vinti" value={m.contractedEstimates} color={FUNNEL_COLORS.won} icon={<Trophy className="h-4 w-4" />} amount={m.contractedValue} />
                    <FunnelRow label="Persi" value={m.lostEstimates} color={FUNNEL_COLORS.lost} icon={<XCircle className="h-4 w-4" />} amount={m.lostValue} />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<FileText className="h-12 w-12 text-muted-foreground/30" />}
                  title="Nessun preventivo nel periodo"
                  description="Crea il tuo primo preventivo per iniziare a popolare la dashboard."
                  cta={<Link to="/projects"><Button variant="default" size="sm">Vai a Progetti <ArrowRight className="h-3 w-3 ml-1" /></Button></Link>}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 3: MATERIALI & FORNITORI ========== */}
        <TabsContent value="materials" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <MaterialsBreakdownCard
              data={m.categoryBreakdown}
              totalCost={m.totalMaterialsCost}
            />

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-primary" />
                  Top fornitori del periodo
                </CardTitle>
                <CardDescription>
                  Chi sta movimentando più volume di acquisti
                </CardDescription>
              </CardHeader>
              <CardContent>
                {m.supplierBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {m.supplierBreakdown.slice(0, 5).map((s, idx) => (
                      <div key={s.supplier} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                            <span className="font-medium truncate">{s.supplier}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-semibold">{euro(s.totalCost)}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {s.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <AnimatedProgress
                          value={s.percentage}
                          max={100}
                          color="primary"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Factory className="h-12 w-12 text-muted-foreground/30" />}
                    title="Nessun fornitore movimentato"
                    description="I preventivi del periodo non hanno ancora materiali assegnati."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== TAB 4: OPERATIVO ========== */}
        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Costo manodopera"
              value={<AnimatedCounter value={m.totalLaborCost} prefix="€ " decimals={0} />}
              description="Totale del periodo"
              icon={<Wrench />}
            />
            <DashboardCard
              title="Tempo posa medio"
              value={<AnimatedCounter value={m.avgInstallationTime} suffix=" min/m²" decimals={1} />}
              description="Su tutte le stratigrafie"
              icon={<Clock />}
            />
            <DashboardCard
              title="Sfrido medio"
              value={<AnimatedCounter value={m.wastePercentage} suffix=" %" decimals={1} />}
              description="Pesato sui materiali usati"
              icon={<AlertTriangle />}
              change={m.wastePercentage > 0 ? {
                value: m.wastePercentage - 10,
                type: m.wastePercentage > 10 ? 'negative' : 'positive',
                label: 'vs benchmark 10%',
              } : undefined}
            />
            <DashboardCard
              title="Costo medio €/m²"
              value={<AnimatedCounter value={m.averageCostPerSqm} prefix="€ " suffix="/m²" decimals={2} />}
              description="Materiali + manodopera"
              icon={<Target />}
            />
          </div>

          {/* Distribuzione superficie nei mesi */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Superficie preventivata per mese
              </CardTitle>
              <CardDescription>
                m² totali nei preventivi creati ogni mese (ultimi 12)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(0)} m²`, 'Superficie']} />
                    <Area
                      type="monotone"
                      dataKey="area"
                      stroke="#3478BE"
                      fill="#3478BE"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, cta }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    <div className="mb-4">{icon}</div>
    <h4 className="font-semibold text-sm mb-1">{title}</h4>
    <p className="text-xs text-muted-foreground mb-3 max-w-xs">{description}</p>
    {cta}
  </div>
);

interface LegendinaProps { color: string; label: string }
const Legendina: React.FC<LegendinaProps> = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
    <span className="text-muted-foreground">{label}</span>
  </div>
);

interface FunnelRowProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  amount?: number;
}
const FunnelRow: React.FC<FunnelRowProps> = ({ label, value, color, icon, amount }) => (
  <div className="flex items-center justify-between p-2 rounded border" style={{ borderColor: `${color}40` }}>
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-right">
      <div className="font-bold">{value}</div>
      {amount !== undefined && amount > 0 && (
        <div className="text-[10px] text-muted-foreground">{euro(amount)}</div>
      )}
    </div>
  </div>
);
