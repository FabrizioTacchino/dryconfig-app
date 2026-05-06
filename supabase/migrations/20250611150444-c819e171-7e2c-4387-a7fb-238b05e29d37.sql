
-- Add new columns for frame materials (montanti) to the materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS sheet_thickness numeric,
ADD COLUMN IF NOT EXISTS weight_per_ml numeric,
ADD COLUMN IF NOT EXISTS profile_type text,
ADD COLUMN IF NOT EXISTS surface_finish text;
