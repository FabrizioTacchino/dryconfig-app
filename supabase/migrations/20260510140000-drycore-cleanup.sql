-- F8.5 — Cleanup completo DryCore (supplier seed di sviluppo)
--
-- Step:
--   1. Rimuove i codici DryCore da screw_length_rules.preferred_codes
--      → il sistema fallback selezionerà il candidato più corto compatibile
--   2. Elimina i 16+1 materials DryCore (16 viti + 1 'Intercapedine d'Aria')
--      → FK layers.screw_material_id ha ON DELETE SET NULL, quindi i layer
--        con vite DryCore perderanno la vite ma manterranno la lastra.
--        L'auto-suggest la ripristinerà al prossimo render.
--   3. Elimina il supplier DryCore.

-- Step 1: filtra preferred_codes per rimuovere codici DryCore
DO $$
DECLARE
  drycore_codes text[];
BEGIN
  SELECT array_agg(m.code)
  INTO drycore_codes
  FROM materials m
  JOIN suppliers s ON s.id = m.supplier_id
  WHERE s.name ILIKE 'drycore';

  IF drycore_codes IS NULL OR cardinality(drycore_codes) = 0 THEN
    RAISE NOTICE 'No DryCore codes found, skipping preferred_codes cleanup';
    RETURN;
  END IF;

  UPDATE screw_length_rules
  SET preferred_codes = ARRAY(
    SELECT c FROM unnest(preferred_codes) AS c
    WHERE c <> ALL(drycore_codes)
  )
  WHERE preferred_codes && drycore_codes;
END $$;

-- Step 2: elimina tutti i materials DryCore.
DELETE FROM materials
WHERE supplier_id IN (
  SELECT id FROM suppliers WHERE name ILIKE 'drycore'
);

-- Step 3: elimina il supplier DryCore
DELETE FROM suppliers WHERE name ILIKE 'drycore';
