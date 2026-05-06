
-- Aggiunge il campo per le tipologie lastre compatibili alle viti
ALTER TABLE public.materials
ADD COLUMN compatible_board_types text[] NULL;

-- Nota: Rende il campo opzionale, può essere usato solo per le viti.

-- (Facoltativo ma consigliato) Aggiornamento dei commenti per mantenere la documentazione aggiornata
COMMENT ON COLUMN public.materials.compatible_board_types IS 'Codici o tipologie di lastre compatibili (usato per le viti)';
