-- F8.0 — Baseline screw_length_rules + screw_spacing_rules
--
-- Le due tabelle esistono già in produzione (project DryConfigV2) ma erano
-- prive di file migration nel repo. Questo file riproduce DDL ed il seed
-- attualmente in DB. È pienamente idempotente: può girare anche su un DB
-- in cui le tabelle esistono già (CREATE IF NOT EXISTS) e già popolate
-- (INSERT ... WHERE NOT EXISTS).

-- =====================================================================
-- 1. ENUM layer_position_role (separato da wall_type → usa _role per evitare conflitti)
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'layer_position_role') THEN
    CREATE TYPE layer_position_role AS ENUM (
      'single',
      'first_provisional',
      'intermediate',
      'final_visible'
    );
  END IF;
END $$;

-- =====================================================================
-- 2. screw_length_rules — lunghezza vite per spessore pacchetto + supporto
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.screw_length_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_type text NOT NULL,                                    -- gesso_rivestito | gessofibra | cemento_fibroarmato | silicato
  support_type text NOT NULL DEFAULT 'metal_thin',             -- metal_thin | metal_thick | wood
  min_total_thickness_mm numeric NOT NULL,
  max_total_thickness_mm numeric NOT NULL,
  min_penetration_mm numeric NOT NULL DEFAULT 10,
  recommended_length_mm integer NOT NULL,
  preferred_codes text[] NOT NULL,                             -- codici materiali catalogo "raccomandati"
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screw_length_rules_lookup
  ON public.screw_length_rules (board_type, support_type, min_total_thickness_mm, max_total_thickness_mm);

ALTER TABLE public.screw_length_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "screw_length_rules read for authenticated" ON public.screw_length_rules;
CREATE POLICY "screw_length_rules read for authenticated"
  ON public.screw_length_rules FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================================
-- 3. screw_spacing_rules — passo di fissaggio per tipo parete + posizione + lastra
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.screw_spacing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_type wall_type NOT NULL,
  layer_position layer_position_role NOT NULL,
  board_type text NOT NULL,
  spacing_field_mm integer NOT NULL,
  spacing_edge_mm integer NOT NULL,
  screws_per_sqm numeric NOT NULL,
  staggered boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screw_spacing_rules_lookup
  ON public.screw_spacing_rules (wall_type, layer_position, board_type);

ALTER TABLE public.screw_spacing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "screw_spacing_rules read for authenticated" ON public.screw_spacing_rules;
CREATE POLICY "screw_spacing_rules read for authenticated"
  ON public.screw_spacing_rules FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================================
-- 4. SEED screw_length_rules (skip se già popolata)
-- =====================================================================
INSERT INTO public.screw_length_rules
  (board_type, support_type, min_total_thickness_mm, max_total_thickness_mm, min_penetration_mm, recommended_length_mm, preferred_codes, notes)
SELECT * FROM (VALUES
  -- Gesso rivestito su lamiera sottile (≤0,7 mm)
  ('gesso_rivestito',     'metal_thin',  0,     13,    10, 25, ARRAY['TN25','TPS25','SNT25'],        'Singolo strato 9,5–12,5 mm'),
  ('gesso_rivestito',     'metal_thin',  13.01, 18,    10, 35, ARRAY['TN35','TPS35','SNT35'],        'Singolo 15 mm o doppio 9,5'),
  ('gesso_rivestito',     'metal_thin',  18.01, 28,    10, 35, ARRAY['TN35','TPS35','SNT35'],        'Doppio 12,5 mm (25 mm pacchetto)'),
  ('gesso_rivestito',     'metal_thin',  28.01, 35,    10, 45, ARRAY['TN45','TPS45','SNT45'],        'Doppio 15 mm o pacchetto fino 35 mm'),
  ('gesso_rivestito',     'metal_thin',  35.01, 45,    10, 55, ARRAY['TN55','TPS55','SNT55'],        'Triplo 12,5 mm (37,5 mm)'),
  ('gesso_rivestito',     'metal_thin',  45.01, 60,    10, 70, ARRAY['TN70'],                         'Pacchetti spessi'),
  -- Gesso rivestito su lamiera spessa (>0,7 mm) → autoperforante
  ('gesso_rivestito',     'metal_thick', 0,     13,    10, 25, ARRAY['FN25','TPSF25'],                'Singolo strato, autoperforante'),
  ('gesso_rivestito',     'metal_thick', 13.01, 28,    10, 35, ARRAY['FN35','TPSF35'],                'Doppio strato, autoperforante'),
  ('gesso_rivestito',     'metal_thick', 28.01, 45,    10, 55, ARRAY['FN55','TPSF55'],                'Pacchetti spessi, autoperforante'),
  -- Gesso rivestito su legno
  ('gesso_rivestito',     'wood',        0,     18,    10, 35, ARRAY['TB35'],                          'Singolo o doppio su legno'),
  ('gesso_rivestito',     'wood',        18.01, 35,    10, 45, ARRAY['TB45'],                          'Pacchetti su legno'),
  -- Gessofibra (Fermacell)
  ('gessofibra',          'metal_thin',  0,     13,    10, 30, ARRAY['FSN30'],                         'Singolo Fermacell 10–12,5 mm'),
  ('gessofibra',          'metal_thin',  13.01, 18,    10, 40, ARRAY['FSN40'],                         'Singolo 15 mm gessofibra'),
  ('gessofibra',          'metal_thin',  18.01, 30,    10, 40, ARRAY['FSN40'],                         'Doppio 10–12,5 mm gessofibra'),
  ('gessofibra',          'metal_thin',  30.01, 40,    10, 55, ARRAY['FSN55'],                         'Doppio 15–18 mm gessofibra'),
  -- Cemento fibroarmato (Aquapanel/Aquaroc)
  ('cemento_fibroarmato', 'metal_thin',  0,     13,    10, 25, ARRAY['MAXISN25','5200585749'],        'Singolo strato cementizia, anticorrosione'),
  ('cemento_fibroarmato', 'metal_thin',  13.01, 28,    10, 39, ARRAY['MAXISN39','5200585750'],        'Doppio strato cementizia'),
  ('cemento_fibroarmato', 'metal_thin',  28.01, 45,    10, 55, ARRAY['MAXISN55'],                      'Pacchetti cementizi spessi'),
  -- Silicato di calcio
  ('silicato',            'metal_thin',  0,     13,    10, 25, ARRAY['TN25','TPS25'],                  'Singolo strato silicato'),
  ('silicato',            'metal_thin',  13.01, 28,    10, 35, ARRAY['TN35','TPS35'],                  'Doppio strato silicato')
) AS seed(board_type, support_type, min_total_thickness_mm, max_total_thickness_mm, min_penetration_mm, recommended_length_mm, preferred_codes, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.screw_length_rules LIMIT 1);

-- =====================================================================
-- 5. SEED screw_spacing_rules (skip se già popolata)
-- =====================================================================
INSERT INTO public.screw_spacing_rules
  (wall_type, layer_position, board_type, spacing_field_mm, spacing_edge_mm, screws_per_sqm, staggered, notes)
SELECT
  v.wall_type::wall_type,
  v.layer_position::layer_position_role,
  v.board_type, v.spacing_field_mm, v.spacing_edge_mm, v.screws_per_sqm, v.staggered, v.notes
FROM (VALUES
  -- Partition (pareti divisorie)
  ('partition', 'single',            'gesso_rivestito',     250, 200, 17::numeric, false, 'Parete divisoria standard, interasse 250 mm'),
  ('partition', 'single',            'gessofibra',          250, 200, 17::numeric, false, 'Fermacell parete singolo strato'),
  ('partition', 'single',            'cemento_fibroarmato', 200, 150, 22::numeric, false, 'Cementizia parete, interasse 200 mm'),
  ('partition', 'single',            'silicato',            250, 200, 17::numeric, false, 'Silicato parete singolo'),
  ('partition', 'first_provisional', 'gesso_rivestito',     750, 500,  6::numeric, true,  '1° strato doppia lastra: interasse largo 500–750 mm'),
  ('partition', 'first_provisional', 'gessofibra',          750, 500,  6::numeric, true,  '1° strato Fermacell doppio'),
  ('partition', 'first_provisional', 'cemento_fibroarmato', 500, 400,  9::numeric, true,  '1° strato cementizia doppio'),
  ('partition', 'intermediate',      'gesso_rivestito',     500, 400, 10::numeric, true,  'Strato intermedio triplo'),
  ('partition', 'intermediate',      'gessofibra',          500, 400, 10::numeric, true,  'Strato intermedio gessofibra triplo'),
  ('partition', 'final_visible',     'gesso_rivestito',     250, 200, 17::numeric, true,  '2° strato definitivo, giunti sfalsati ≥600 mm'),
  ('partition', 'final_visible',     'gessofibra',          250, 200, 17::numeric, true,  '2° strato Fermacell definitivo'),
  ('partition', 'final_visible',     'cemento_fibroarmato', 200, 150, 22::numeric, true,  '2° strato cementizia definitivo'),
  -- Lining (controparete)
  ('lining',    'single',            'gesso_rivestito',     250, 200, 17::numeric, false, 'Controparete singolo strato'),
  ('lining',    'first_provisional', 'gesso_rivestito',     750, 500,  6::numeric, true,  'Controparete doppia: 1° provvisorio'),
  ('lining',    'final_visible',     'gesso_rivestito',     250, 200, 17::numeric, true,  'Controparete doppia: definitivo'),
  -- Ceiling (controsoffitto)
  ('ceiling',   'single',            'gesso_rivestito',     170, 150, 24::numeric, false, 'Controsoffitto interasse 170 mm (Knauf D11)'),
  ('ceiling',   'single',            'gessofibra',          170, 150, 24::numeric, false, 'Controsoffitto Fermacell'),
  ('ceiling',   'single',            'cemento_fibroarmato', 170, 150, 24::numeric, false, 'Controsoffitto cementizia esterno'),
  ('ceiling',   'first_provisional', 'gesso_rivestito',     500, 400, 10::numeric, true,  'Controsoffitto doppio: 1° strato'),
  ('ceiling',   'final_visible',     'gesso_rivestito',     170, 150, 24::numeric, true,  'Controsoffitto doppio: 2° strato definitivo')
) AS v(wall_type, layer_position, board_type, spacing_field_mm, spacing_edge_mm, screws_per_sqm, staggered, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.screw_spacing_rules LIMIT 1);

COMMENT ON TABLE public.screw_length_rules IS
  'Lunghezza minima vite raccomandata per pacchetto lastre + tipo supporto. Consultata da useScrewRecommendation.';
COMMENT ON TABLE public.screw_spacing_rules IS
  'Passo di fissaggio (mm) e densità (pz/m²) per tipo parete + posizione layer + tipo lastra. Norma UNI-EN 13964 / DIN 18181.';
