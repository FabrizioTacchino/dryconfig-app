-- Remove obsolete accessory columns from stratigraphies table
ALTER TABLE stratigraphies DROP COLUMN IF EXISTS corner_cost_per_sqm;
ALTER TABLE stratigraphies DROP COLUMN IF EXISTS tape_cost_per_sqm;
ALTER TABLE stratigraphies DROP COLUMN IF EXISTS putty_cost_per_sqm;
ALTER TABLE stratigraphies DROP COLUMN IF EXISTS accessories_cost_per_sqm;

-- Create updated comprehensive cost calculation function that matches UI exactly
CREATE OR REPLACE FUNCTION public.update_comprehensive_costs_final()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    strat_record RECORD;
    mat_cost NUMERIC := 0;
    screw_cost NUMERIC := 0;
    total_install_time NUMERIC := 0;
    labor_cost NUMERIC := 0;
    total_cost NUMERIC := 0;
    hourly_rate NUMERIC := 100; -- €100/hour
BEGIN
    -- Iterate through all stratigraphies
    FOR strat_record IN 
        SELECT s.id, s.name
        FROM stratigraphies s
    LOOP
        -- Reset costs for each stratigraphy
        mat_cost := 0;
        screw_cost := 0;
        total_install_time := 0;
        
        -- Calculate material costs and installation time from ALL layers (including accessory layers)
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN m.unit_price IS NOT NULL AND m.incidence_per_sqm IS NOT NULL 
                    THEN m.unit_price * m.incidence_per_sqm
                    ELSE 0
                END
            ), 0),
            COALESCE(SUM(COALESCE(l.screw_cost_per_sqm, 0)), 0),
            COALESCE(SUM(
                CASE 
                    WHEN m.installation_time_per_sqm IS NOT NULL 
                    THEN m.installation_time_per_sqm
                    ELSE 0
                END
            ), 0)
        INTO mat_cost, screw_cost, total_install_time
        FROM layers l
        JOIN materials m ON l.material_id = m.id
        WHERE l.stratigraphy_id = strat_record.id;
        
        -- Calculate labor cost: (installation_time_minutes * hourly_rate) / 60
        labor_cost := (total_install_time * hourly_rate) / 60;
        
        -- Calculate total comprehensive cost (ONLY materials + screws + labor, NO accessory percentages)
        total_cost := mat_cost + screw_cost + labor_cost;
        
        -- Update the stratigraphy with calculated costs (NO accessory columns)
        UPDATE stratigraphies 
        SET 
            material_cost_per_sqm = ROUND(mat_cost::numeric, 2),
            screw_cost_per_sqm = ROUND(screw_cost::numeric, 2),
            labor_cost_per_sqm = ROUND(labor_cost::numeric, 2),
            comprehensive_cost_per_sqm = ROUND(total_cost::numeric, 2),
            installation_time_per_sqm = ROUND(total_install_time::numeric, 2),
            cost_per_sqm = ROUND(total_cost::numeric, 2) -- Update legacy field
        WHERE id = strat_record.id;
        
        -- Update individual layer costs for detailed tracking
        UPDATE layers 
        SET 
            material_cost_per_sqm = ROUND((
                SELECT COALESCE(m.unit_price * m.incidence_per_sqm, 0)
                FROM materials m 
                WHERE m.id = layers.material_id
            )::numeric, 2),
            installation_time_minutes = ROUND((
                SELECT COALESCE(m.installation_time_per_sqm, 0)
                FROM materials m 
                WHERE m.id = layers.material_id
            )::numeric, 2)
        WHERE stratigraphy_id = strat_record.id;
        
        RAISE NOTICE 'Updated stratigraphy %: Total cost %.2f (Materials: %.2f, Screws: %.2f, Labor: %.2f, Install time: %.2f min)', 
                     strat_record.name, total_cost, mat_cost, screw_cost, labor_cost, total_install_time;
    END LOOP;
    
    RAISE NOTICE 'Final comprehensive costs update completed - accessories now handled as layers';
END;
$function$;

-- Run the updated cost calculation
SELECT update_comprehensive_costs_final();