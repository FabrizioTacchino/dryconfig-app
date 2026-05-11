-- F10 #154 — Settings configuratore: write limitata a owner/admin
--
-- Problema: waste_factors, finish_levels, finish_level_components,
-- screw_preferences avevano write policy "is_member_of" → qualsiasi membro
-- (incluso viewer/technician) poteva modificare gli sfridi / finiture /
-- preferenze viti dell'organizzazione. Non voluto.
--
-- Fix: write limitata a owner+admin via has_org_role.
-- Read resta aperta a tutti i membri (necessario per il calcolo nei preventivi).

-- waste_factors
DROP POLICY IF EXISTS "members write own org waste_factors" ON public.waste_factors;
CREATE POLICY "admins write own org waste_factors"
  ON public.waste_factors
  FOR ALL
  TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin']::organization_role[])
  );

-- finish_levels
DROP POLICY IF EXISTS "members write own org finish_levels" ON public.finish_levels;
CREATE POLICY "admins write own org finish_levels"
  ON public.finish_levels
  FOR ALL
  TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin']::organization_role[])
  );

-- finish_level_components (organization_id letto via JOIN su finish_levels)
DROP POLICY IF EXISTS "members write own org finish_components" ON public.finish_level_components;
CREATE POLICY "admins write own org finish_components"
  ON public.finish_level_components
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.finish_levels fl
      WHERE fl.id = finish_level_components.finish_level_id
        AND has_org_role(fl.organization_id, ARRAY['owner','admin']::organization_role[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.finish_levels fl
      WHERE fl.id = finish_level_components.finish_level_id
        AND has_org_role(fl.organization_id, ARRAY['owner','admin']::organization_role[])
    )
  );

-- screw_preferences
DROP POLICY IF EXISTS "members write own org screw_preferences" ON public.screw_preferences;
CREATE POLICY "admins write own org screw_preferences"
  ON public.screw_preferences
  FOR ALL
  TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin']::organization_role[])
  );
