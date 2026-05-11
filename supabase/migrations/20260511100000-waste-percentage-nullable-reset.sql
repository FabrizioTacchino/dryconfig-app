-- F9.1 — Semantica nuova per materials.waste_percentage:
--   NULL  = nessun override per-materiale, segui Settings → Sfridi (per categoria)
--   value = override esplicito (es. Wallboard piccolo con più scarto del default board)
--
-- Step:
--   1. DROP DEFAULT 10 (i nuovi materiali parteranno NULL = ereditano categoria)
--   2. UPDATE tutti i materiali a NULL per allineare la baseline al Settings.
--      L'utente potrà poi sovrascrivere caso-per-caso dalla scheda materiale.

ALTER TABLE materials ALTER COLUMN waste_percentage DROP DEFAULT;
UPDATE materials SET waste_percentage = NULL;
