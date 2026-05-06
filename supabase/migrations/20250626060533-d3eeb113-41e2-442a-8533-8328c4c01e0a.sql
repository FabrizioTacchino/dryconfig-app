
-- Aggiungi le colonne separate per ogni tipo di accessorio nella tabella stratigraphies
ALTER TABLE public.stratigraphies 
ADD COLUMN corner_cost_per_sqm NUMERIC DEFAULT 0,
ADD COLUMN tape_cost_per_sqm NUMERIC DEFAULT 0,
ADD COLUMN putty_cost_per_sqm NUMERIC DEFAULT 0;

-- Aggiungi commenti per documentare le nuove colonne
COMMENT ON COLUMN public.stratigraphies.corner_cost_per_sqm IS 'Costo angolari per metro quadro';
COMMENT ON COLUMN public.stratigraphies.tape_cost_per_sqm IS 'Costo nastro carta/rete per metro quadro';
COMMENT ON COLUMN public.stratigraphies.putty_cost_per_sqm IS 'Costo stucco per metro quadro';

-- Modifica la funzione per calcolare i costi comprensivi con accessori separati
CREATE OR REPLACE FUNCTION update_comprehensive_costs()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    strat_record RECORD;
    mat_cost NUMERIC := 0;
    screw_cost NUMERIC := 0;
    labor_cost NUMERIC := 0;
    corner_cost NUMERIC := 0;
    tape_cost NUMERIC := 0;
    putty_cost NUMERIC := 0;
    total_accessories_cost NUMERIC := 0;
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
        -- Calcola i costi base
        mat_cost := strat_record.calculated_material_cost;
        screw_cost := strat_record.calculated_screw_cost;
        labor_cost := mat_cost * 0.3; -- 30% del costo materiali
        
        -- Calcola i costi degli accessori separatamente
        corner_cost := mat_cost * 0.025; -- 2.5% per angolari
        tape_cost := mat_cost * 0.035; -- 3.5% per nastro
        putty_cost := mat_cost * 0.08; -- 8% per stucco
        total_accessories_cost := corner_cost + tape_cost + putty_cost;
        
        -- Calcola il costo totale
        total_cost := mat_cost + screw_cost + labor_cost + total_accessories_cost;
        
        -- Aggiorna la stratigrafia con tutti i costi calcolati separatamente
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
            cost_per_sqm = ROUND(total_cost::numeric, 2) -- Aggiorna anche il costo legacy
        WHERE id = strat_record.id;
        
        RAISE NOTICE 'Updated stratigraphy %: Total cost %.2f (Materials: %.2f, Screws: %.2f, Labor: %.2f, Corners: %.2f, Tape: %.2f, Putty: %.2f, Total Accessories: %.2f)', 
                     strat_record.name, total_cost, mat_cost, screw_cost, labor_cost, corner_cost, tape_cost, putty_cost, total_accessories_cost;
    END LOOP;
    
    RAISE NOTICE 'Comprehensive costs update completed with separated accessory costs';
END;
$$;

-- Esegui la funzione per aggiornare tutte le stratigrafie esistenti con i nuovi costi separati
SELECT update_comprehensive_costs();
