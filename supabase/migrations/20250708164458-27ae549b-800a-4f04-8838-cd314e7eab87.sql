
-- Verifica se esiste il costo orario e aggiungilo se mancante
INSERT INTO configurator_settings (key, value)
VALUES ('cost_per_hour', '30')
ON CONFLICT (key) DO UPDATE SET value = '30', updated_at = now();
