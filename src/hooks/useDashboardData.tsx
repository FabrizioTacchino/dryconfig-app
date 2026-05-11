
import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWasteFactors } from '@/hooks/useWasteFactors';

export interface DashboardMetrics {
  // Project metrics
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  archivedProjects: number;
  
  // Estimate metrics
  totalEstimates: number;
  draftEstimates: number;
  pendingEstimates: number;
  approvedEstimates: number;
  contractedEstimates: number;
  
  // Financial metrics
  totalValue: number;
  contractedValue: number;
  pendingValue: number;
  averageEstimateValue: number;
  
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
  
  // Monthly trends
  monthlyTrends: Array<{
    month: string;
    projects: number;
    estimates: number;
    value: number;
    area: number;
  }>;
}

export const useDashboardData = () => {
  const { wasteMap } = useWasteFactors();
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();

  // Fetch comprehensive estimate data
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
    // Project metrics
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const archivedProjects = projects.filter(p => p.status === 'archived').length;

    // Estimate metrics
    const draftEstimates = estimatesData.filter(e => e.status === 'draft').length;
    const pendingEstimates = estimatesData.filter(e => e.status === 'pending').length;
    const approvedEstimates = estimatesData.filter(e => e.status === 'approved').length;
    const contractedEstimates = estimatesData.filter(e => e.status === 'contracted').length;

    // Financial calculations
    const totalValue = estimatesData.reduce((sum, e) => sum + (e.total_amount || 0), 0);
    const contractedValue = estimatesData
      .filter(e => e.status === 'contracted')
      .reduce((sum, e) => sum + (e.total_amount || 0), 0);
    const pendingValue = estimatesData
      .filter(e => e.status === 'pending' || e.status === 'approved')
      .reduce((sum, e) => sum + (e.total_amount || 0), 0);

    // Materials and operational metrics
    let totalMaterialsCost = 0;
    let totalLaborCost = 0;
    let totalSurfaceArea = 0;
    let totalWastePercentage = 0;
    let totalDisposalPercentage = 0;
    let totalInstallationTime = 0;
    let stratigraphyCount = 0;

    const supplierCosts = new Map<string, number>();
    const categoryCosts = new Map<string, { cost: number; items: number }>();

    estimatesData.forEach(estimate => {
      estimate.estimate_stratigraphies?.forEach((strati: any) => {
        totalSurfaceArea += strati.area || 0;
        stratigraphyCount++;
        
        if (strati.stratigraphy_data && typeof strati.stratigraphy_data === 'object' && 'layers' in strati.stratigraphy_data) {
          const stratigraphyDataObj = strati.stratigraphy_data as { layers?: any[] };
          stratigraphyDataObj.layers?.forEach((layer: any) => {
            if (layer.materials) {
              const material = layer.materials;
              const layerCost = (material.unit_price || 0) * (strati.area || 0) * (material.incidence_per_sqm || 1);
              
              totalMaterialsCost += layerCost;
              
              // Supplier breakdown
              const supplier = material.supplier || 'Non specificato';
              supplierCosts.set(supplier, (supplierCosts.get(supplier) || 0) + layerCost);
              
              // Category breakdown
              const category = material.category || 'Altri';
              const current = categoryCosts.get(category) || { cost: 0, items: 0 };
              categoryCosts.set(category, {
                cost: current.cost + layerCost,
                items: current.items + 1
              });
              
              // Waste and disposal percentages.
              // Sfrido: override sul materiale (se NOT NULL) > Settings → Sfridi per categoria.
              const wasteOverride = material.waste_percentage;
              const resolvedWaste = (wasteOverride !== null && wasteOverride !== undefined)
                ? Number(wasteOverride)
                : (wasteMap[material.category ?? ''] ?? 0);
              totalWastePercentage += resolvedWaste;
              totalDisposalPercentage += material.disposal_percentage || 4;
              totalInstallationTime += material.installation_time_per_sqm || 0;
            }
            
            // Labor costs
            if (layer.labor_cost_per_sqm) {
              totalLaborCost += layer.labor_cost_per_sqm * (strati.area || 0);
            }
          });
        }
      });
    });

    // Generate supplier breakdown
    const totalSupplierCost = Array.from(supplierCosts.values()).reduce((sum, cost) => sum + cost, 0);
    const supplierBreakdown = Array.from(supplierCosts.entries())
      .map(([supplier, cost]) => ({
        supplier,
        totalCost: cost,
        percentage: totalSupplierCost > 0 ? (cost / totalSupplierCost) * 100 : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Generate category breakdown
    const totalCategoryCost = Array.from(categoryCosts.values()).reduce((sum, item) => sum + item.cost, 0);
    const categoryBreakdown = Array.from(categoryCosts.entries())
      .map(([category, data]) => ({
        category,
        totalCost: data.cost,
        percentage: totalCategoryCost > 0 ? (data.cost / totalCategoryCost) * 100 : 0,
        items: data.items
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Generate monthly trends (last 6 months)
    const monthlyTrends = [];
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      const monthStart = new Date();
      monthStart.setMonth(currentMonth - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date();
      monthEnd.setMonth(currentMonth - i + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthProjects = projects.filter(p => {
        const createdDate = new Date(p.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;

      const monthEstimates = estimatesData.filter(e => {
        const createdDate = new Date(e.created_at);
        return createdDate >= monthStart && createdDate <= monthEnd;
      });

      const monthValue = monthEstimates.reduce((sum, e) => sum + (e.total_amount || 0), 0);
      const monthArea = monthEstimates.reduce((sum, e) => {
        return sum + (e.estimate_stratigraphies?.reduce((areaSum: number, s: any) => areaSum + (s.area || 0), 0) || 0);
      }, 0);

      monthlyTrends.push({
        month: monthName,
        projects: monthProjects,
        estimates: monthEstimates.length,
        value: monthValue,
        area: monthArea
      });
    }

    return {
      // Project metrics
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      archivedProjects,
      
      // Estimate metrics
      totalEstimates: estimatesData.length,
      draftEstimates,
      pendingEstimates,
      approvedEstimates,
      contractedEstimates,
      
      // Financial metrics
      totalValue,
      contractedValue,
      pendingValue,
      averageEstimateValue: estimatesData.length > 0 ? totalValue / estimatesData.length : 0,
      
      // Materials metrics
      totalMaterialsCost,
      totalLaborCost,
      totalSurfaceArea,
      averageCostPerSqm: totalSurfaceArea > 0 ? (totalMaterialsCost + totalLaborCost) / totalSurfaceArea : 0,
      
      // Operational metrics
      wastePercentage: stratigraphyCount > 0 ? totalWastePercentage / stratigraphyCount : 10,
      disposalPercentage: stratigraphyCount > 0 ? totalDisposalPercentage / stratigraphyCount : 4,
      avgInstallationTime: stratigraphyCount > 0 ? totalInstallationTime / stratigraphyCount : 0,
      
      // Breakdowns
      supplierBreakdown,
      categoryBreakdown,
      monthlyTrends
    };
  }, [projects, estimatesData, materialsData]);

  return {
    dashboardMetrics,
    isLoading: projectsLoading || estimatesLoading || materialsLoading,
    projects,
    estimatesData,
    materialsData
  };
};
