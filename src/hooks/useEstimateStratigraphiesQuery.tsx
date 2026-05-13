
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

function safeNumber(val: any, fallback = 0) {
  const n = Number(val);
  return !isFinite(n) || isNaN(n) ? fallback : n;
}

function safeInt(val: any, fallback = 1) {
  const n = parseInt(val);
  return !isFinite(n) || isNaN(n) ? fallback : n;
}

export const useEstimateStratigraphiesQuery = (estimateId?: string) => {
  const { user } = useAuth();

  const { data: estimateStratigraphies = [], isLoading, error } = useQuery({
    queryKey: ['estimate-stratigraphies', estimateId],
    queryFn: async () => {
      if (!user || !estimateId) return [];
      
      console.log('Fetching estimate stratigraphies for estimate:', estimateId);

      const { data, error } = await supabase
        .from('estimate_stratigraphies')
        .select(`
          *,
          stratigraphies: stratigraphies!estimate_stratigraphies_stratigraphy_id_fkey (
            id,
            name,
            description,
            type,
            total_thickness,
            cost_per_sqm,
            is_certified,
            fire_resistance_class,
            acoustic_performance,
            weight_per_sqm,
            thermal_performance,
            layers: layers (
              id,
              material_id,
              thickness,
              position,
              inter_axis,
              screw_material_id,
              screw_quantity,
              screw_cost_per_sqm,
              material_cost_per_sqm,
              installation_time_minutes,
              materials!layers_material_id_fkey (
                id,
                name,
                code,
                ean_code,
                color_hex,
                category,
                unit,
                unit_price,
                supplier,
                supplier_id,
                incidence_per_sqm,
                weight_per_sqm,
                thermal_conductivity,
                acoustic_performance,
                fire_resistance_class,
                compatible_board_types,
                width,
                length,
                box_pieces,
                installation_time_per_sqm,
                waste_percentage
              ),
              screw_materials:materials!layers_screw_material_id_fkey (
                id,
                name,
                code,
                ean_code,
                color_hex,
                category,
                unit,
                unit_price,
                supplier,
                supplier_id,
                incidence_per_sqm,
                length,
                box_pieces,
                installation_time_per_sqm,
                waste_percentage
              )
            )
          )
        `)
        .eq('estimate_id', estimateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching estimate stratigraphies:', error);
        throw error;
      }

      // Log values to debug area/quantity
      if (data) {
        console.log('[DEBUG] Fetched stratigraphies db rows:', data.map(
          item => ({
            id: item.id,
            area: item.area,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost
          })
        ));
      }

      return (data || []).map(item => {
        // Notare che area e quantity vanno normalizzati!
        const area = safeNumber(item.area, 0);
        const quantity = safeInt(item.quantity, 1);
        const unitCost = safeNumber(item.unit_cost, 0);
        const totalCost = safeNumber(item.total_cost, 0);

        if (item.is_snapshot && item.stratigraphy_data) {
          const stratigraphyData = (typeof item.stratigraphy_data === 'object' && item.stratigraphy_data !== null)
            ? item.stratigraphy_data
            : {};
          
          const snapshotName = typeof stratigraphyData['name'] === 'string'
            ? stratigraphyData['name']
            : '';
          
          const snapshotDescription = typeof stratigraphyData['description'] === 'string'
            ? stratigraphyData['description']
            : '';

          const stratigraphy = {
            ...(typeof stratigraphyData === 'object' && stratigraphyData !== null ? stratigraphyData : {}),
            layers: Array.isArray(item.layers_data) ? item.layers_data : [],
          };

          return {
            id: item.id,
            estimateId: item.estimate_id,
            stratigraphyId: item.stratigraphy_id,
            name: item.name ?? snapshotName,
            description: item.description ?? snapshotDescription,
            area,
            quantity,
            unitCost,
            totalCost,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
            stratigraphyData: item.stratigraphy_data,
            layersData: item.layers_data,
            pricesUpdatedAt: item.prices_updated_at ? new Date(item.prices_updated_at) : undefined,
            // F32: altezza parete dichiarata. Per le righe pre-F32 puo` essere
            // NULL → useMaterialsSummary applica fallback 2.7m.
            wallHeight: (item as any).wall_height != null ? Number((item as any).wall_height) : undefined,
            isSnapshot: true,
            originalStratigraphyId: item.original_stratigraphy_id,
            finishLevel: (item as any).finish_level ?? null,
            finishCostPerSqm: (item as any).finish_cost_per_sqm != null ? Number((item as any).finish_cost_per_sqm) : null,
            finishLaborMinutesPerSqm: (item as any).finish_labor_minutes_per_sqm != null ? Number((item as any).finish_labor_minutes_per_sqm) : null,
            finishComponentsData: Array.isArray((item as any).finish_components_data) ? (item as any).finish_components_data : null,
            stratigraphy,
          };
        }

        if (item.stratigraphies && typeof item.stratigraphies === 'object' && !Array.isArray(item.stratigraphies)) {
          return {
            id: item.id,
            estimateId: item.estimate_id,
            stratigraphyId: item.stratigraphy_id,
            name: item.name,
            description: item.description || '',
            area,
            quantity,
            unitCost,
            totalCost,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
            stratigraphyData: item.stratigraphy_data,
            layersData: item.layers_data,
            pricesUpdatedAt: item.prices_updated_at ? new Date(item.prices_updated_at) : undefined,
            // F32: altezza parete dichiarata. Per le righe pre-F32 puo` essere
            // NULL → useMaterialsSummary applica fallback 2.7m.
            wallHeight: (item as any).wall_height != null ? Number((item as any).wall_height) : undefined,
            isSnapshot: item.is_snapshot || false,
            originalStratigraphyId: item.original_stratigraphy_id,
            finishLevel: (item as any).finish_level ?? null,
            finishCostPerSqm: (item as any).finish_cost_per_sqm != null ? Number((item as any).finish_cost_per_sqm) : null,
            finishLaborMinutesPerSqm: (item as any).finish_labor_minutes_per_sqm != null ? Number((item as any).finish_labor_minutes_per_sqm) : null,
            finishComponentsData: Array.isArray((item as any).finish_components_data) ? (item as any).finish_components_data : null,
            stratigraphy: {
              ...item.stratigraphies,
              layers: item.stratigraphies.layers?.sort((a: any, b: any) => a.position - b.position) || [],
            },
          };
        }

        // Orphan case, no snapshot and no stratigrafia original
        return {
          id: item.id,
          estimateId: item.estimate_id,
          stratigraphyId: item.stratigraphy_id,
          name: item.name || 'Stratigrafia eliminata',
          description: item.description || 'La stratigrafia originale è stata eliminata',
          area,
          quantity,
          unitCost,
          totalCost,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          stratigraphyData: item.stratigraphy_data,
          layersData: item.layers_data,
          pricesUpdatedAt: item.prices_updated_at ? new Date(item.prices_updated_at) : undefined,
          isSnapshot: item.is_snapshot || false,
          originalStratigraphyId: item.original_stratigraphy_id,
          finishLevel: (item as any).finish_level ?? null,
          finishCostPerSqm: (item as any).finish_cost_per_sqm != null ? Number((item as any).finish_cost_per_sqm) : null,
          finishLaborMinutesPerSqm: (item as any).finish_labor_minutes_per_sqm != null ? Number((item as any).finish_labor_minutes_per_sqm) : null,
          finishComponentsData: Array.isArray((item as any).finish_components_data) ? (item as any).finish_components_data : null,
          stratigraphy: null,
        };
      }) as (EstimateStratigraphy & { stratigraphy: any, quantity: number })[];
    },
    enabled: !!user && !!estimateId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const totalCost = estimateStratigraphies.reduce((sum, item) => sum + (typeof item.totalCost === "number" && !isNaN(item.totalCost) ? item.totalCost : 0), 0);

  return {
    estimateStratigraphies,
    isLoading,
    error,
    totalCost,
  };
};
