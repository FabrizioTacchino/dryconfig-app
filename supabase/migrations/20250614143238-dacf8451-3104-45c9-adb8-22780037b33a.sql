
-- Rende la colonna stratigraphy_id nullable, così ON DELETE SET NULL funziona correttamente
ALTER TABLE public.estimate_stratigraphies
ALTER COLUMN stratigraphy_id DROP NOT NULL;
