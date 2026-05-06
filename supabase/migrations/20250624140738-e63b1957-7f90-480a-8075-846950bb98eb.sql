
-- Aggiungi colonne per integrare le viti direttamente nel layer
ALTER TABLE public.layers 
ADD COLUMN screw_material_id UUID NULL,
ADD COLUMN screw_quantity INTEGER NULL DEFAULT NULL,
ADD COLUMN screw_cost_per_sqm NUMERIC NULL DEFAULT NULL;

-- Aggiungi foreign key per il materiale della vite
ALTER TABLE public.layers 
ADD CONSTRAINT layers_screw_material_id_fkey 
FOREIGN KEY (screw_material_id) REFERENCES public.materials(id) ON DELETE SET NULL;

-- Rimuovi la colonna parent_layer_id che sta causando i problemi
ALTER TABLE public.layers 
DROP COLUMN IF EXISTS parent_layer_id;

-- Rimuovi anche equal_parts_quantity dato che ora usiamo screw_quantity
ALTER TABLE public.layers 
DROP COLUMN IF EXISTS equal_parts_quantity;

-- Aggiungi commenti per documentare le nuove colonne
COMMENT ON COLUMN public.layers.screw_material_id IS 'ID del materiale della vite associata a questo layer';
COMMENT ON COLUMN public.layers.screw_quantity IS 'Quantità di viti per metro quadro';
COMMENT ON COLUMN public.layers.screw_cost_per_sqm IS 'Costo delle viti per metro quadro';
