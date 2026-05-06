-- Add waste_percentage and disposal_percentage columns to materials table
ALTER TABLE public.materials 
ADD COLUMN waste_percentage NUMERIC DEFAULT 10,
ADD COLUMN disposal_percentage NUMERIC DEFAULT 4;

-- Add comments to document the columns
COMMENT ON COLUMN public.materials.waste_percentage IS 'Percentuale di sfrido da aggiungere al prezzo scontato (default 10%)';
COMMENT ON COLUMN public.materials.disposal_percentage IS 'Percentuale di discarica da aggiungere al prezzo scontato (default 4%)';