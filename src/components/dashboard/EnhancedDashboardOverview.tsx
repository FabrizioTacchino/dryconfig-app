
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, FileText, Euro, Clock, 
  Package, Wrench, AlertTriangle, Target, Factory, Truck
} from 'lucide-react';

import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardCard } from './DashboardCard';
import { MaterialsBreakdownCard } from './MaterialsBreakdownCard';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { AnimatedProgress } from '@/components/ui/animated-progress';

const COLORS = ['#1E5091', '#3478BE', '#5696D7', '#84B4E5', '#A8C5E8', '#CCE0F0'];

export const EnhancedDashboardOverview = () => {
  const { dashboardMetrics, isLoading } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('6m');

  // Add safety checks for all data used in charts
  if (isLoading || !dashboardMetrics) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Ultimo mese</SelectItem>
            <SelectItem value="3m">Ultimi 3 mesi</SelectItem>
            <SelectItem value="6m">Ultimi 6 mesi</SelectItem>
            <SelectItem value="1y">Ultimo anno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Progetti Attivi"
          value={<AnimatedCounter value={dashboardMetrics?.activeProjects || 0} />}
          description={`${dashboardMetrics?.totalProjects || 0} progetti totali`}
          icon={<Users />}
          change={{
            value: (dashboardMetrics?.totalProjects || 0) > 0 ? 
              ((dashboardMetrics?.activeProjects || 0) / (dashboardMetrics?.totalProjects || 1)) * 100 - 50 : 0,
            type: (dashboardMetrics?.activeProjects || 0) > (dashboardMetrics?.completedProjects || 0) ? 'positive' : 'neutral'
          }}
        />

        <DashboardCard
          title="Preventivi"
          value={<AnimatedCounter value={dashboardMetrics?.totalEstimates || 0} />}
          description={`${dashboardMetrics?.contractedEstimates || 0} contrattualizzati`}
          icon={<FileText />}
          change={{
            value: (dashboardMetrics?.totalEstimates || 0) > 0 ? 
              ((dashboardMetrics?.contractedEstimates || 0) / (dashboardMetrics?.totalEstimates || 1)) * 100 : 0,
            type: 'positive',
            label: 'contrattualizzati'
          }}
        />

        <DashboardCard
          title="Valore Totale"
          value={<AnimatedCounter value={dashboardMetrics?.totalValue || 0} prefix="€" />}
          description={`€${(dashboardMetrics?.contractedValue || 0).toLocaleString('it-IT')} contrattualizzato`}
          icon={<Euro />}
          change={{
            value: (dashboardMetrics?.totalValue || 0) > 0 ? 
              ((dashboardMetrics?.contractedValue || 0) / (dashboardMetrics?.totalValue || 1)) * 100 : 0,
            type: 'positive',
            label: 'del totale'
          }}
        />

        <DashboardCard
          title="Superficie Totale"
          value={<AnimatedCounter value={dashboardMetrics?.totalSurfaceArea || 0} suffix=" m²" decimals={0} />}
          description={`€${(dashboardMetrics?.averageCostPerSqm || 0).toFixed(2)}/m² costo medio`}
          icon={<Target />}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="materials">Materiali</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="operational">Operativo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Status Distribution */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Distribuzione Progetti</CardTitle>
                <CardDescription>Stato attuale dei progetti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Attivi</span>
                    <span className="font-semibold">{dashboardMetrics?.activeProjects || 0}</span>
                  </div>
                  <AnimatedProgress
                    value={dashboardMetrics?.activeProjects || 0}
                    max={Math.max(dashboardMetrics?.totalProjects || 1, 1)}
                    color="primary"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span>Completati</span>
                    <span className="font-semibold">{dashboardMetrics?.completedProjects || 0}</span>
                  </div>
                  <AnimatedProgress
                    value={dashboardMetrics?.completedProjects || 0}
                    max={Math.max(dashboardMetrics?.totalProjects || 1, 1)}
                    color="success"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Estimate Status */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle>Stato Preventivi</CardTitle>
                <CardDescription>Pipeline dei preventivi</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Bozze', value: dashboardMetrics?.draftEstimates || 0 },
                          { name: 'In attesa', value: dashboardMetrics?.pendingEstimates || 0 },
                          { name: 'Approvati', value: dashboardMetrics?.approvedEstimates || 0 },
                          { name: 'Contrattualizzati', value: dashboardMetrics?.contractedEstimates || 0 }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card className="col-span-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle>Trend Mensili</CardTitle>
              <CardDescription>Andamento degli ultimi 6 mesi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardMetrics?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="projects" 
                      stackId="1"
                      stroke="#1E5091" 
                      fill="#1E5091" 
                      name="Progetti"
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="estimates" 
                      stackId="1"
                      stroke="#3478BE" 
                      fill="#3478BE" 
                      name="Preventivi"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="value" 
                      stroke="#5696D7" 
                      strokeWidth={3}
                      name="Valore (€)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MaterialsBreakdownCard
              data={dashboardMetrics?.categoryBreakdown || []}
              totalCost={dashboardMetrics?.totalMaterialsCost || 0}
            />

            {/* Supplier Breakdown */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Fornitori Principali</CardTitle>
                <CardDescription>Top fornitori per volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(dashboardMetrics?.supplierBreakdown || []).slice(0, 5).map((supplier, index) => (
                    <div key={supplier.supplier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{supplier.supplier}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">€{supplier.totalCost.toLocaleString('it-IT')}</div>
                        <div className="text-xs text-muted-foreground">{supplier.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <DashboardCard
              title="Valore Medio Preventivo"
              value={<AnimatedCounter value={dashboardMetrics?.averageEstimateValue || 0} prefix="€" />}
              icon={<TrendingUp />}
            />
            
            <DashboardCard
              title="Costo Medio/m²"
              value={<AnimatedCounter value={dashboardMetrics?.averageCostPerSqm || 0} prefix="€" suffix="/m²" decimals={2} />}
              icon={<Target />}
            />
            
            <DashboardCard
              title="Tempo Installazione Medio"
              value={<AnimatedCounter value={dashboardMetrics?.avgInstallationTime || 0} suffix=" min/m²" decimals={1} />}
              icon={<Clock />}
            />
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Manodopera Totale"
              value={<AnimatedCounter value={dashboardMetrics?.totalLaborCost || 0} prefix="€" />}
              description="Costo manodopera"
              icon={<Wrench />}
            />
            
            <DashboardCard
              title="Sfrido Medio"
              value={<AnimatedCounter value={dashboardMetrics?.wastePercentage || 0} suffix="%" decimals={1} />}
              description="Percentuale sfrido"
              icon={<AlertTriangle />}
              change={{
                value: (dashboardMetrics?.wastePercentage || 0) - 10,
                type: (dashboardMetrics?.wastePercentage || 0) > 10 ? 'negative' : 'positive'
              }}
            />
            
            <DashboardCard
              title="Discarica Media"
              value={<AnimatedCounter value={dashboardMetrics?.disposalPercentage || 0} suffix="%" decimals={1} />}
              description="Percentuale discarica"
              icon={<Truck />}
              change={{
                value: (dashboardMetrics?.disposalPercentage || 0) - 4,
                type: (dashboardMetrics?.disposalPercentage || 0) > 4 ? 'negative' : 'positive'
              }}
            />
            
            <DashboardCard
              title="Efficienza"
              value={`${(((dashboardMetrics?.contractedEstimates || 0) / Math.max(dashboardMetrics?.totalEstimates || 1, 1)) * 100).toFixed(0)}%`}
              description="Tasso contrattualizzazione"
              icon={<Target />}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
