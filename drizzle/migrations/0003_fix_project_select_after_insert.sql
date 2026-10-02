DROP POLICY IF EXISTS "projects view" ON public.projects;
CREATE POLICY "projects view" ON public.projects FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.can_view_project(id, auth.uid()));