
-- Aggiungi le nuove colonne per memorizzare tutti i costi separatamente nella tabella stratigraphies
ALTER TABLE public.stratigraphies 
ADD COLUMN material_cost_per_sqm NUMERIC DEFAULT 0,
ADD COLUMN screw_cost_per_sqm NUMERIC DEFAULT 0,
ADD COLUMN accessories_cost_per_sqm NUMERIC DEFAULT 0,
ADD COLUMN labor_cost_per_sqm NUMERIC DEFAULT 0,
ADD COLUMN comprehensive_cost_per_sqm NUMERIC DEFAULT 0;

-- Aggiungi commenti per documentare le nuove colonne
COMMENT ON COLUMN public.stratigraphies.material_cost_per_sqm IS 'Costo dei soli materiali per metro quadro';
COMMENT ON COLUMN public.stratigraphies.screw_cost_per_sqm IS 'Costo delle viti per metro quadro';
COMMENT ON COLUMN public.stratigraphies.accessories_cost_per_sqm IS 'Costo accessori (angolari, nastro, stucco) per metro quadro';
COMMENT ON COLUMN public.stratigraphies.labor_cost_per_sqm IS 'Costo manodopera per metro quadro';
COMMENT ON COLUMN public.stratigraphies.comprehensive_cost_per_sqm IS 'Costo totale comprensivo per metro quadro';

-- Crea una funzione per calcolare e aggiornare i costi comprehensivi per tutte le stratigrafie esistenti
CREATE OR REPLACE FUNCTION update_comprehensive_costs()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    strat_record RECORD;
    mat_cost NUMERIC := 0;
    screw_cost NUMERIC := 0;
    labor_cost NUMERIC := 0;
    accessories_cost NUMERIC := 0;
    total_cost NUMERIC := 0;
BEGIN
    -- Itera su tutte le stratigrafie
    FOR strat_record IN 
        SELECT s.id, s.name, 
               COALESCE(
                   (SELECT SUM(
                       COALESCE(m.unit_price, 0) * COALESCE(m.incidence_per_sqm, 1)
                   )
                   FROM layers l
                   JOIN materials m ON l.material_id = m.id
                   WHERE l.stratigraphy_id = s.id
                   ), 0
               ) as calculated_material_cost,
               COALESCE(
                   (SELECT SUM(COALESCE(l.screw_cost_per_sqm, 0))
                   FROM layers l
                   WHERE l.stratigraphy_id = s.id
                   ), 0
               ) as calculated_screw_cost
        FROM stratigraphies s
    LOOP
        -- Calcola i costi
        mat_cost := strat_record.calculated_material_cost;
        screw_cost := strat_record.calculated_screw_cost;
        labor_cost := mat_cost * 0.3; -- 30% del costo materiali
        accessories_cost := mat_cost * 0.1; -- 10% del costo materiali
        total_cost := mat_cost + screw_cost + labor_cost + accessories_cost;
        
        -- Aggiorna la stratigrafia con tutti i costi calcolati
        UPDATE stratigraphies 
        SET 
            material_cost_per_sqm = ROUND(mat_cost::numeric, 2),
            screw_cost_per_sqm = ROUND(screw_cost::numeric, 2),
            labor_cost_per_sqm = ROUND(labor_cost::numeric, 2),
            accessories_cost_per_sqm = ROUND(accessories_cost::numeric, 2),
            comprehensive_cost_per_sqm = ROUND(total_cost::numeric, 2),
            cost_per_sqm = ROUND(total_cost::numeric, 2) -- Aggiorna anche il costo legacy
        WHERE id = strat_record.id;
        
        RAISE NOTICE 'Updated stratigraphy %: Total cost %.2f (Materials: %.2f, Screws: %.2f, Labor: %.2f, Accessories: %.2f)', 
                     strat_record.name, total_cost, mat_cost, screw_cost, labor_cost, accessories_cost;
    END LOOP;
    
    RAISE NOTICE 'Comprehensive costs update completed for all stratigraphies';
END;
$$;

-- Esegui la funzione per aggiornare tutte le stratigrafie esistenti
SELECT update_comprehensive_costs();
