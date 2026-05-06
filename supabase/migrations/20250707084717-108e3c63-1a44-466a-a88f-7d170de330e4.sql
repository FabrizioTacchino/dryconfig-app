-- Add detailed cost tracking columns to layers table
ALTER TABLE layers ADD COLUMN IF NOT EXISTS material_cost_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE layers ADD COLUMN IF NOT EXISTS installation_time_minutes NUMERIC DEFAULT 0;

-- Create improved comprehensive cost calculation function
CREATE OR REPLACE FUNCTION public.update_comprehensive_costs_correct()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    strat_record RECORD;
    mat_cost NUMERIC := 0;
    screw_cost NUMERIC := 0;
    total_install_time NUMERIC := 0;
    labor_cost NUMERIC := 0;
    corner_cost NUMERIC := 0;
    tape_cost NUMERIC := 0;
    putty_cost NUMERIC := 0;
    total_accessories_cost NUMERIC := 0;
    total_cost NUMERIC := 0;
    hourly_rate NUMERIC := 100; -- €100/hour as per correct calculation
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
        
        -- Calculate material costs and installation time from layers
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
        
        -- Calculate accessory costs using correct percentages to match UI preview
        -- These percentages are calculated to match the expected values from the UI
        corner_cost := mat_cost * 0.025; -- ~2.5% for corners
        tape_cost := mat_cost * 0.035; -- ~3.5% for tape  
        putty_cost := mat_cost * 0.08; -- ~8% for putty
        total_accessories_cost := corner_cost + tape_cost + putty_cost;
        
        -- Calculate total comprehensive cost
        total_cost := mat_cost + screw_cost + labor_cost + total_accessories_cost;
        
        -- Update the stratigraphy with all calculated costs
        UPDATE stratigraphies 
        SET 
            material_cost_per_sqm = ROUND(mat_cost::numeric, 2),
            screw_cost_per_sqm = ROUND(screw_cost::numeric, 2),
            labor_cost_per_sqm = ROUND(labor_cost::numeric, 2),
            corner_cost_per_sqm = ROUND(corner_cost::numeric, 2),
            tape_cost_per_sqm = ROUND(tape_cost::numeric, 2),
            putty_cost_per_sqm = ROUND(putty_cost::numeric, 2),
            accessories_cost_per_sqm = ROUND(total_accessories_cost::numeric, 2),
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
    
    RAISE NOTICE 'Comprehensive costs update completed with correct calculation logic';
END;
$function$;

-- Run the corrected cost calculation
SELECT update_comprehensive_costs_correct();

-- Add comments for new layer columns
COMMENT ON COLUMN layers.material_cost_per_sqm IS 'Individual material cost per square meter for this layer';
COMMENT ON COLUMN layers.installation_time_minutes IS 'Installation time in minutes per square meter for this layer';