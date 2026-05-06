
-- Estendere la tabella materials con i nuovi campi per le lastre
ALTER TABLE public.materials 
ADD COLUMN material_type text,
ADD COLUMN density numeric,
ADD COLUMN flexural_strength text,
ADD COLUMN surface_hardness text,
ADD COLUMN en_520_type text,
ADD COLUMN water_absorption text,
ADD COLUMN humidity_resistance_class text,
ADD COLUMN environmental_certification text,
ADD COLUMN recycled_content numeric,
ADD COLUMN voc_class text,
ADD COLUMN rei_compatible boolean DEFAULT false,
ADD COLUMN intended_use text[], -- Array per selezione multipla
ADD COLUMN installation_notes text,
ADD COLUMN fire_class text,
ADD COLUMN fire_description text,
ADD COLUMN board_type text,
ADD COLUMN fire_usage_notes text;

-- Creare tabella per mapping automatico delle classi antincendio
CREATE TABLE public.fire_class_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fire_class text NOT NULL UNIQUE,
  description text NOT NULL,
  board_type text NOT NULL,
  usage_notes text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Popolare la tabella con i mapping delle classi antincendio
INSERT INTO public.fire_class_mappings (fire_class, description, board_type, usage_notes) VALUES
('A1', 'Materiale incombustibile – Non partecipa all''incendio', 'Lastra speciale ad alte prestazioni (es. Glasroc F, Promatect, Fireboard)', 'Per compartimentazioni EI 120 / EI 180, usi critici (es. vani scala, data center)'),
('A2-s1,d0', 'Materiale quasi incombustibile, emissione minima di fumo, nessuna goccia', 'Lastra ignifuga speciale (es. GKF con trattamento)', 'Pareti EI 90 – EI 120 in ambienti pubblici'),
('B-s1,d0', 'Materiale difficilmente infiammabile, fumo molto basso, no gocce', 'Lastra ignifuga standard (es. Gyproc Fireline, Knauf KFI)', 'Ambienti a medio rischio, cinema, scuole'),
('B-s2,d0', 'Come sopra, ma con più fumo', 'Lastra standard con additivi antincendio', 'Uffici, aree comuni, uso generale'),
('C-s1,d0', 'Materiale moderatamente infiammabile, fumo contenuto', 'Raro in lastre cartongesso, più comune in isolanti economici', 'Non raccomandato per pareti REI'),
('C-s2,d1', 'Infiammabile, moderata fumosità, rilascio di gocce incandescenti', 'Usato in prodotti economici, non certificabili per uso REI', 'Solo uso provvisorio o esterno'),
('D-s2,d2', 'Materiale facilmente infiammabile, alta emissione fumo, gocce incandescenti', 'Pannelli legnosi senza trattamenti', 'Non adatto per interni soggetti a normativa antincendio'),
('E', 'Materiale combustibile, brucia facilmente', 'Polistirolo, alcuni legni trattati', 'Non consentito in ambienti regolati dal Codice Prevenzione Incendi'),
('F', 'Nessuna prestazione determinata', 'Materiali non testati', 'Da evitare in ambienti normati');

-- Aggiungere commenti per chiarire l'uso dei nuovi campi
COMMENT ON COLUMN public.materials.material_type IS 'Tipo specifico di materiale (es. gesso rivestito, silicato, cemento)';
COMMENT ON COLUMN public.materials.density IS 'Densità del materiale in kg/m³';
COMMENT ON COLUMN public.materials.flexural_strength IS 'Resistenza alla flessione';
COMMENT ON COLUMN public.materials.surface_hardness IS 'Durezza superficiale';
COMMENT ON COLUMN public.materials.en_520_type IS 'Tipo EN 520 (es. DF, DFFH2IR)';
COMMENT ON COLUMN public.materials.water_absorption IS 'Assorbimento acqua';
COMMENT ON COLUMN public.materials.humidity_resistance_class IS 'Classe di resistenza all''umidità (H1, H2, H3)';
COMMENT ON COLUMN public.materials.environmental_certification IS 'Certificazione ambientale (es. EPD)';
COMMENT ON COLUMN public.materials.recycled_content IS 'Contenuto riciclato in percentuale';
COMMENT ON COLUMN public.materials.voc_class IS 'Classe VOC (A+, A, ecc.)';
COMMENT ON COLUMN public.materials.rei_compatible IS 'Compatibile con sistemi REI';
COMMENT ON COLUMN public.materials.intended_use IS 'Uso previsto (array di: pareti, controsoffitti, cavedi)';
COMMENT ON COLUMN public.materials.installation_notes IS 'Note di posa';
COMMENT ON COLUMN public.materials.fire_class IS 'Classe antincendio (es. A1, A2-s1,d0, B-s1,d0)';
COMMENT ON COLUMN public.materials.fire_description IS 'Descrizione prestazioni antincendio (compilato automaticamente)';
COMMENT ON COLUMN public.materials.board_type IS 'Tipologia di lastra (compilato automaticamente)';
COMMENT ON COLUMN public.materials.fire_usage_notes IS 'Note d''uso antincendio (compilato automaticamente)';

-- Creare indice per ottimizzare le query per fire_class_mappings
CREATE INDEX idx_fire_class_mappings_fire_class ON public.fire_class_mappings(fire_class);
