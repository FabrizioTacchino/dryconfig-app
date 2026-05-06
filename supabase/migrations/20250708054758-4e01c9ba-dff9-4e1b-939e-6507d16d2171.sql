-- Add new board typology values to support the expanded classification
-- Adding new typologies: antivapore, alta_densita, idro_fire, fibrocemento, doppia_densita

-- Note: We can't modify enum types directly, so we'll update the check constraints or use text fields
-- Since board_typology is already a text field, we don't need to modify the table structure

-- Add new material type values for more specific classification
-- The material_type field is also text, so no structural changes needed

-- Let's add some sample materials based on the provided list to populate the database
INSERT INTO materials (
  code, name, category, supplier, material_type, board_typology, 
  thickness, unit_price, unit, description
) VALUES 
  -- Gyproc Wallboard Standard
  ('GYP-WB-13', 'Gyproc Wallboard 13', 'board', 'Gyproc', 'gesso_rivestito', 'standard', 13, 4.50, 'mq', 'Lastra in gesso rivestito standard 13mm'),
  ('GYP-WB-15', 'Gyproc Wallboard 15', 'board', 'Gyproc', 'gesso_rivestito', 'standard', 15, 5.20, 'mq', 'Lastra in gesso rivestito standard 15mm'),
  ('GYP-WB-18', 'Gyproc Wallboard 18', 'board', 'Gyproc', 'gesso_rivestito', 'standard', 18, 6.10, 'mq', 'Lastra in gesso rivestito standard 18mm'),
  
  -- Gyproc Hydro
  ('GYP-HY-13', 'Gyproc Hydro 13 H2', 'board', 'Gyproc', 'gesso_resistente_umidita', 'idro', 13, 6.80, 'mq', 'Lastra in gesso resistente all''umidità 13mm'),
  ('GYP-HY-15', 'Gyproc Hydro 15 H2', 'board', 'Gyproc', 'gesso_resistente_umidita', 'idro', 15, 7.50, 'mq', 'Lastra in gesso resistente all''umidità 15mm'),
  
  -- Gyproc Vapor
  ('GYP-VP-13', 'Gyproc Vapor 13', 'board', 'Gyproc', 'gesso_rivestito', 'antivapore', 13, 7.20, 'mq', 'Lastra in gesso rivestito antivapore 13mm'),
  
  -- Gyproc Fireline
  ('GYP-FL-13', 'Gyproc Fireline 13', 'board', 'Gyproc', 'gesso_ignifugo', 'ignifuga', 13, 8.50, 'mq', 'Lastra in gesso ignifugo 13mm'),
  ('GYP-FL-15', 'Gyproc Fireline 15', 'board', 'Gyproc', 'gesso_ignifugo', 'ignifuga', 15, 9.20, 'mq', 'Lastra in gesso ignifugo 15mm'),
  ('GYP-FL-20', 'Gyproc Fireline 20', 'board', 'Gyproc', 'gesso_ignifugo', 'ignifuga', 20, 11.80, 'mq', 'Lastra in gesso ignifugo 20mm'),
  ('GYP-FL-25', 'Gyproc Fireline 25', 'board', 'Gyproc', 'gesso_ignifugo', 'ignifuga', 25, 14.50, 'mq', 'Lastra in gesso ignifugo 25mm'),
  
  -- Gyproc Lisaplac
  ('GYP-LP-13', 'Gyproc Lisaplac 13', 'board', 'Gyproc', 'gesso_rivestito', 'alta_densita', 13, 9.80, 'mq', 'Lastra in gesso rivestito ad alta densità 13mm'),
  
  -- Gyproc Lisaflam
  ('GYP-LF-13', 'Gyproc Lisaflam 13', 'board', 'Gyproc', 'gesso_ignifugo', 'ignifuga', 13, 10.50, 'mq', 'Lastra in gesso ignifugo Lisaflam 13mm'),
  
  -- Gyproc Aquaroc
  ('GYP-AQ-13', 'Gyproc Aquaroc 13', 'board', 'Gyproc', 'cemento_fibroarmato', 'fibrocemento', 13, 12.90, 'mq', 'Lastra in cemento fibroarmato 13mm'),
  
  -- Habito Forte
  ('HAB-FT-13', 'Habito Forte 13', 'board', 'Gyproc', 'gesso_alte_prestazioni', 'alta_densita', 13, 15.60, 'mq', 'Lastra in gesso ad alte prestazioni Forte 13mm'),
  ('HAB-AA-13', 'Habito Activ''Air 13', 'board', 'Gyproc', 'gesso_alte_prestazioni', 'alta_densita', 13, 16.20, 'mq', 'Lastra in gesso ad alte prestazioni Activ''Air 13mm'),
  
  -- Habito variants
  ('HAB-HY-13', 'Habito Hydro 13', 'board', 'Gyproc', 'gesso_alte_prestazioni', 'idro_fire', 13, 17.50, 'mq', 'Lastra Habito resistente all''umidità 13mm'),
  ('HAB-VP-13', 'Habito Vapor 13', 'board', 'Gyproc', 'gesso_alte_prestazioni', 'antivapore', 13, 18.20, 'mq', 'Lastra Habito antivapore 13mm'),
  ('HAB-CL-13', 'Habito Clima 13', 'board', 'Gyproc', 'gesso_alte_prestazioni', 'idro_fire', 13, 19.80, 'mq', 'Lastra Habito climatica 13mm'),
  
  -- DuraGyp
  ('DUR-GY-13', 'DuraGyp 13', 'board', 'Altri', 'gesso_fibra_rinforzata', 'ignifuga', 13, 13.50, 'mq', 'Lastra in gesso fibra rinforzata 13mm'),
  ('DUR-GY-15', 'DuraGyp 15', 'board', 'Altri', 'gesso_fibra_rinforzata', 'alta_densita', 15, 15.20, 'mq', 'Lastra in gesso fibra rinforzata 15mm'),
  ('DUR-GY-A1', 'DuraGyp A1', 'board', 'Altri', 'gesso_fibra_rinforzata', 'ignifuga', 13, 16.90, 'mq', 'Lastra in gesso fibra rinforzata A1'),
  
  -- Duplex Roccia
  ('DPX-RC-13', 'Duplex Roccia 3-10 STD BA 13x300', 'board', 'Altri', 'roccia_minerale', 'doppia_densita', 13, 22.50, 'mq', 'Pannello doppia densità roccia minerale 13mm')
  
ON CONFLICT (code) DO NOTHING;

-- Update existing materials to use the new typology system if they exist
UPDATE materials 
SET 
  material_type = CASE 
    WHEN board_typology = 'idro' AND material_type = 'gesso_rivestito' THEN 'gesso_resistente_umidita'
    ELSE material_type
  END,
  board_typology = CASE
    WHEN board_typology = 'alta_densita' THEN 'alta_densita'
    WHEN board_typology = 'acustica' THEN 'alta_densita'  -- Convert acoustic to high density
    WHEN board_typology = 'antimuffa' THEN 'idro'  -- Convert antimold to hydro
    WHEN board_typology = 'speciali' THEN 'alta_densita'  -- Convert special to high density
    WHEN board_typology = 'idro_fire' THEN 'idro_fire'
    ELSE board_typology
  END
WHERE category = 'board';