-- F8.1 — screw_preferences per organization
--
-- Permette a ogni org di sovrascrivere i preferred_codes di sistema per
-- ciascuna regola screw_length_rules. Se preferred_material_id diventa NULL
-- (perché il materiale è stato eliminato dal catalogo), il sistema farà
-- fallback ai preferred_codes di sistema e mostrerà un warning in UI.

CREATE TABLE IF NOT EXISTS public.screw_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  length_rule_id  uuid NOT NULL REFERENCES public.screw_length_rules(id) ON DELETE CASCADE,
  preferred_material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, length_rule_id, priority)
);

CREATE INDEX IF NOT EXISTS idx_screw_preferences_org ON public.screw_preferences (organization_id);
CREATE INDEX IF NOT EXISTS idx_screw_preferences_rule ON public.screw_preferences (length_rule_id);
CREATE INDEX IF NOT EXISTS idx_screw_preferences_material ON public.screw_preferences (preferred_material_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.screw_preferences_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_screw_preferences_updated_at ON public.screw_preferences;
CREATE TRIGGER trg_screw_preferences_updated_at
  BEFORE UPDATE ON public.screw_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.screw_preferences_set_updated_at();

-- RLS
ALTER TABLE public.screw_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read own org screw_preferences" ON public.screw_preferences;
CREATE POLICY "members read own org screw_preferences"
  ON public.screw_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = screw_preferences.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members write own org screw_preferences" ON public.screw_preferences;
CREATE POLICY "members write own org screw_preferences"
  ON public.screw_preferences
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = screw_preferences.organization_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = screw_preferences.organization_id
        AND om.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.screw_preferences IS
  'Preferenze viti per organization, sovrascrivono i preferred_codes di sistema in screw_length_rules. priority=1 è la preferenza primaria.';
