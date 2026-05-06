
-- Add equal_parts_quantity field to layers table to store screw quantities
ALTER TABLE public.layers ADD COLUMN equal_parts_quantity integer DEFAULT NULL;

-- Add comment to document the field purpose
COMMENT ON COLUMN public.layers.equal_parts_quantity IS 'Number of equal parts/screws per square meter for screw layers';
