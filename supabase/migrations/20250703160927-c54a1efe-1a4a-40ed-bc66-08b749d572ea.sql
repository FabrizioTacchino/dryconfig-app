-- Increase precision for material prices to support 4 decimal places
-- This allows for precise screw costs like 0.0050€

ALTER TABLE public.materials 
ALTER COLUMN unit_price TYPE NUMERIC(10,4);

ALTER TABLE public.materials 
ALTER COLUMN list_price TYPE NUMERIC(10,4);