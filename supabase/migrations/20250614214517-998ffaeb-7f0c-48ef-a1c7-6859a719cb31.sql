
-- Aggiungi la colonna "notes" nella tabella estimates
ALTER TABLE public.estimates
ADD COLUMN notes TEXT;

-- (opzionale) Aggiorna le viste/materializzazioni correlate se necessario.
