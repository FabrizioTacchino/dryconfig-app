
-- Aggiungi il campo parent_layer_id per collegare le viti alle lastre
ALTER TABLE public.layers 
ADD COLUMN parent_layer_id UUID NULL;

-- Aggiungi foreign key constraint
ALTER TABLE public.layers 
ADD CONSTRAINT layers_parent_layer_id_fkey 
FOREIGN KEY (parent_layer_id) REFERENCES public.layers(id) ON DELETE CASCADE;

-- Aggiungi commento per documentare il campo
COMMENT ON COLUMN public.layers.parent_layer_id IS 'ID del layer padre (per collegare viti alle lastre)';

-- Rimuovi il campo custom_screws che non useremo più
ALTER TABLE public.layers 
DROP COLUMN IF EXISTS custom_screws;
