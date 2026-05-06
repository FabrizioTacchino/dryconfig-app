
-- Aggiungi il valore 'screw' (e 'other' se manca) all'enum material_category

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'material_category' AND e.enumlabel = 'screw'
  ) THEN
    ALTER TYPE material_category ADD VALUE 'screw';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'material_category' AND e.enumlabel = 'other'
  ) THEN
    ALTER TYPE material_category ADD VALUE 'other';
  END IF;
END $$;

