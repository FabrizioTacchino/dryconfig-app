
-- Fix labor cost calculation to use correct hourly rate and complete installation time
CREATE OR REPLACE FUNCTION public.update_comprehensive_costs_final()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    strat_record RECORD;
    layer_record RECORD;
    mat_cost NUMERIC := 0;
    screw_cost NUMERIC := 0;
    total_install_time NUMERIC := 0;
    labor_cost NUMERIC := 0;
    total_cost NUMERIC := 0;
    hourly_rate NUMERIC := 30; -- Default fallback rate
BEGIN
    -- Get the actual hourly rate from configurator_settings
    SELECT COALESCE(value::numeric, 30) INTO hourly_rate
    FROM configurator_settings 
    WHERE key = 'cost_per_hour'
    LIMIT 1;

    RAISE NOTICE '🔥 USING FIXED HOURLY RATE: %.2f from configurator_settings', hourly_rate;

    -- First, update individual layer costs with CORRECT labor cost calculations
    FOR layer_record IN 
        SELECT l.id, l.stratigraphy_id, m.installation_time_per_sqm, l.screw_quantity
        FROM layers l
        JOIN materials m ON l.material_id = m.id
    LOOP
        -- Calculate individual layer installation time (material + screws)
        DECLARE
            layer_install_time NUMERIC := 0;
            layer_labor_cost NUMERIC := 0;
        BEGIN
            -- Base installation time from material
            layer_install_time := COALESCE(layer_record.installation_time_per_sqm, 0);
            
            -- Add screw installation time (0.03 minutes per screw)
            IF layer_record.screw_quantity IS NOT NULL AND layer_record.screw_quantity > 0 THEN
                layer_install_time := layer_install_time + (layer_record.screw_quantity * 0.03);
            END IF;
            
            -- 🔥 CALCULATE LABOR COST CORRECTLY: (installation_time_minutes * hourly_rate) / 60
            layer_labor_cost := (layer_install_time * hourly_rate) / 60;
            
            -- Update the layer with complete installation time and CORRECT labor cost
            UPDATE layers 
            SET 
                installation_time_minutes = ROUND(layer_install_time::numeric, 3),
                labor_cost_per_hour = hourly_rate,
                labor_cost_per_sqm = ROUND(layer_labor_cost::numeric, 3),
                material_cost_per_sqm = ROUND((
                    SELECT COALESCE(m.unit_price * m.incidence_per_sqm, 0)
                    FROM materials m 
                    WHERE m.id = layers.material_id
                )::numeric, 3)
            WHERE id = layer_record.id;
            
            RAISE NOTICE '🔥 FIXED Layer %: Install time %.3f min, Labor cost: %.3f @ %.2f€/h', 
                         layer_record.id, layer_install_time, layer_labor_cost, hourly_rate;
        END;
    END LOOP;

    -- Now iterate through all stratigraphies to calculate totals from CORRECTED layer values
    FOR strat_record IN 
        SELECT s.id, s.name
        FROM stratigraphies s
    LOOP
        -- Reset costs for each stratigraphy
        mat_cost := 0;
        screw_cost := 0;
        total_install_time := 0;
        labor_cost := 0;
        
        -- Calculate totals from CORRECTED layer values
        SELECT 
            COALESCE(SUM(COALESCE(l.material_cost_per_sqm, 0)), 0),
            COALESCE(SUM(COALESCE(l.screw_cost_per_sqm, 0)), 0),
            COALESCE(SUM(COALESCE(l.installation_time_minutes, 0)), 0),
            COALESCE(SUM(COALESCE(l.labor_cost_per_sqm, 0)), 0)
        INTO mat_cost, screw_cost, total_install_time, labor_cost
        FROM layers l
        WHERE l.stratigraphy_id = strat_record.id;
        
        -- Calculate total comprehensive cost with HIGH PRECISION
        total_cost := mat_cost + screw_cost + labor_cost;
        
        -- Update the stratigraphy with calculated costs using PRECISE rounding
        UPDATE stratigraphies 
        SET 
            material_cost_per_sqm = ROUND(mat_cost::numeric, 3),
            screw_cost_per_sqm = ROUND(screw_cost::numeric, 3),
            labor_cost_per_sqm = ROUND(labor_cost::numeric, 3),
            comprehensive_cost_per_sqm = ROUND(total_cost::numeric, 2),
            installation_time_per_sqm = ROUND(total_install_time::numeric, 3),
            cost_per_sqm = ROUND(total_cost::numeric, 2) -- Update legacy field
        WHERE id = strat_record.id;
        
        RAISE NOTICE '🔥 FIXED stratigraphy %: Total cost %.3f (Materials: %.3f, Screws: %.3f, Labor: %.3f @ %.2f€/h, Install time: %.3f min)', 
                     strat_record.name, total_cost, mat_cost, screw_cost, labor_cost, hourly_rate, total_install_time;
    END LOOP;
    
    RAISE NOTICE '🔥 LABOR COST FIX COMPLETED - all layers now use CORRECT 30€/h rate for labor calculation';
END;
$function$;

-- Run the corrected function to fix existing data
SELECT update_comprehensive_costs_final();
