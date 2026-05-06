
-- Add passo column to materials table for structure frame and guide materials
ALTER TABLE public.materials 
ADD COLUMN passo numeric DEFAULT 600;

-- Add comment to clarify the purpose
COMMENT ON COLUMN public.materials.passo IS 'Standard spacing in mm for structure frame and guide materials (default 600mm)';
