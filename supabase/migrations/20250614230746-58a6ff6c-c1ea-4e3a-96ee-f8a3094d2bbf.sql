
-- 1. Aggiungi 'other' all'enum material_category
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_category') THEN
    CREATE TYPE material_category AS ENUM (
      'board', 'structure_frame', 'structure_guide', 'insulation', 'accessory', 'other'
    );
  ELSE
    -- Add 'other' if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = 'material_category'::regtype
    ) THEN
      ALTER TYPE material_category ADD VALUE 'other';
    END IF;
  END IF;
END $$;

-- 2. Nuovi campi per materiali "Altro"
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS is_variable_thickness boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mechanical_performance text,
  ADD COLUMN IF NOT EXISTS thermal_performance_notes text,
  ADD COLUMN IF NOT EXISTS sustainability_notes text,
  ADD COLUMN IF NOT EXISTS system_compatibility text,
  ADD COLUMN IF NOT EXISTS fire_performance_notes text,
  ADD COLUMN IF NOT EXISTS carbon_footprint text,
  ADD COLUMN IF NOT EXISTS epd text,
  ADD COLUMN IF NOT EXISTS vapor_permeability text,
  ADD COLUMN IF NOT EXISTS thermal_capacity text;
