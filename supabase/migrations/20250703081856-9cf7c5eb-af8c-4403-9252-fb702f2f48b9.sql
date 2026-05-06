-- Modifica il campo discount da numeric a text per supportare sconti multipli
ALTER TABLE materials 
ALTER COLUMN discount TYPE text 
USING CASE 
  WHEN discount IS NULL THEN NULL
  ELSE discount::text 
END;

-- Aggiorna il commento della colonna per chiarezza
COMMENT ON COLUMN materials.discount IS 'Sconti cumulativi separati da +. Esempio: 50+25+5 per sconti del 50%, poi 25%, poi 5%';