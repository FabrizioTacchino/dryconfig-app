
-- Aggiunge la colonna custom_screws alla tabella layers per memorizzare le configurazioni delle viti personalizzate
ALTER TABLE public.layers 
ADD COLUMN custom_screws JSONB NULL;

-- Aggiungi un commento per documentare il campo
COMMENT ON COLUMN public.layers.custom_screws IS 'Configurazioni viti personalizzate per il layer, formato: {"screwId": "uuid", "quantity": number}';
