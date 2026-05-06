
-- Tabella per quantità viti per posizione nel blocco (es. interna, intermedia, esterna)
CREATE TABLE public.screw_quantity_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_in_block integer NOT NULL, -- 1 = interna, 2 = intermedia, ecc.
  quantity_per_sqm integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(position_in_block)
);

-- Tabella per preferenze vite per intervallo lunghezza richiesta
CREATE TABLE public.screw_preference_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_length_mm integer NOT NULL,
  max_length_mm integer, -- NULL = nessun massimo (>= min)
  preferred_order text[] NOT NULL, -- Ordine preferito per codice vite
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici e vincoli di utilità
CREATE INDEX screw_quantity_settings_position_idx ON public.screw_quantity_settings(position_in_block);
CREATE INDEX screw_preference_rules_minlength_idx ON public.screw_preference_rules(min_length_mm);

-- Dati di default RACCOMANDATI (per evitare breaking change)
INSERT INTO public.screw_quantity_settings (position_in_block, quantity_per_sqm, description) VALUES
  (1, 6, 'Lastra interna (verso struttura)'),
  (2, 8, 'Lastra intermedia'),
  (3, 12, 'Lastra esterna (verso ambiente)');

-- Esempio base preferenze vite (aggiustabile via UI dopo deploy)
INSERT INTO public.screw_preference_rules (min_length_mm, max_length_mm, preferred_order, description) VALUES
  (45, null, ARRAY['TN45','TN50','TN55'], 'Viti preferite per spessori grossi'),
  (35, 44, ARRAY['TN35','TN40'], 'Per spessori medi'),
  (22, 34, ARRAY['TN25'], 'Per spessori sottili');

