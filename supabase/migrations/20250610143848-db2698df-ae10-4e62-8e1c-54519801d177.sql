
-- Add incidence_base column to materials table
ALTER TABLE public.materials 
ADD COLUMN incidence_base numeric DEFAULT NULL;

-- Add comments to clarify the purpose of incidence fields
COMMENT ON COLUMN public.materials.incidence_per_sqm IS 'Final incidence value per square meter (calculated or manual)';
COMMENT ON COLUMN public.materials.incidence_base IS 'Base incidence value for structure_frame materials (at 600mm spacing)';
