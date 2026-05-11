-- F11 #157 — Rename role 'manager' → 'supervisor' + RLS update
--
-- Modello finale (5 ruoli):
--   owner      = Titolare       (tutto + billing + eliminazione org)
--   admin      = Amministratore (gestione org, membri, fornitori, sconti)
--   supervisor = Supervisore    (approva eliminazioni progetti/preventivi)
--   technician = Tecnico        (data entry: crea/modifica, niente delete)
--   viewer     = Visualizzatore (solo lettura)

ALTER TYPE organization_role RENAME VALUE 'manager' TO 'supervisor';

-- projects.delete passa da [owner,admin] a [owner,admin,supervisor]
DROP POLICY IF EXISTS "Org admins can delete projects" ON public.projects;
CREATE POLICY "Org supervisors can delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor']::organization_role[])
  );

-- projects.update aggiunge supervisor
DROP POLICY IF EXISTS "Org writers can update projects" ON public.projects;
CREATE POLICY "Org writers can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  );

-- estimates — split delete (no technician) da update (con technician)
DROP POLICY IF EXISTS "Org writers can delete estimates" ON public.estimates;
DROP POLICY IF EXISTS "Org writers can update estimates" ON public.estimates;

CREATE POLICY "Org supervisors can delete estimates"
  ON public.estimates FOR DELETE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor']::organization_role[])
  );

CREATE POLICY "Org writers can update estimates"
  ON public.estimates FOR UPDATE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  );

-- estimate_stratigraphies (join via estimates)
DROP POLICY IF EXISTS "Org writers can manage estimate stratigraphies" ON public.estimate_stratigraphies;
CREATE POLICY "Org writers can manage estimate stratigraphies"
  ON public.estimate_stratigraphies FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estimates e
      WHERE e.id = estimate_stratigraphies.estimate_id
        AND has_org_role(e.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estimates e
      WHERE e.id = estimate_stratigraphies.estimate_id
        AND has_org_role(e.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  );

-- estimate_walls (join via estimates)
DROP POLICY IF EXISTS "Org writers can manage estimate walls" ON public.estimate_walls;
CREATE POLICY "Org writers can manage estimate walls"
  ON public.estimate_walls FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estimates e
      WHERE e.id = estimate_walls.estimate_id
        AND has_org_role(e.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estimates e
      WHERE e.id = estimate_walls.estimate_id
        AND has_org_role(e.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  );

-- stratigraphies — split update da delete (delete senza technician)
DROP POLICY IF EXISTS "Org writers can update custom stratigraphies" ON public.stratigraphies;
DROP POLICY IF EXISTS "Org writers can delete custom stratigraphies" ON public.stratigraphies;

CREATE POLICY "Org writers can update custom stratigraphies"
  ON public.stratigraphies FOR UPDATE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  );

CREATE POLICY "Org supervisors can delete custom stratigraphies"
  ON public.stratigraphies FOR DELETE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor']::organization_role[])
  );

-- layers (join via stratigraphies)
DROP POLICY IF EXISTS "Org writers can manage layers" ON public.layers;
CREATE POLICY "Org writers can manage layers"
  ON public.layers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stratigraphies s
      WHERE s.id = layers.stratigraphy_id
        AND s.organization_id IS NOT NULL
        AND has_org_role(s.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stratigraphies s
      WHERE s.id = layers.stratigraphy_id
        AND s.organization_id IS NOT NULL
        AND has_org_role(s.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  );

-- wall_configurations (organization_id diretto)
DROP POLICY IF EXISTS "Org writers can manage wall configurations" ON public.wall_configurations;
CREATE POLICY "Org writers can manage wall configurations"
  ON public.wall_configurations FOR ALL TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  );

-- walls (join via estimates)
DROP POLICY IF EXISTS "Org writers can manage walls" ON public.walls;
CREATE POLICY "Org writers can manage walls"
  ON public.walls FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estimates e
      WHERE e.id = walls.estimate_id
        AND has_org_role(e.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estimates e
      WHERE e.id = walls.estimate_id
        AND has_org_role(e.organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
    )
  );

-- materials + suppliers
DROP POLICY IF EXISTS "Org writers can manage own org materials" ON public.materials;
CREATE POLICY "Org writers can manage own org materials"
  ON public.materials FOR ALL TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  );

DROP POLICY IF EXISTS "Org writers can manage own org suppliers" ON public.suppliers;
CREATE POLICY "Org writers can manage own org suppliers"
  ON public.suppliers FOR ALL TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin','supervisor','technician']::organization_role[])
  );
