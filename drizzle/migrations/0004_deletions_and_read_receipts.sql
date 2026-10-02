CREATE TABLE public.message_reads (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
GRANT SELECT, INSERT ON public.message_reads TO authenticated;
GRANT ALL ON public.message_reads TO service_role;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.message_author(_mid uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT author_id FROM public.messages WHERE id = _mid;
$$;
CREATE OR REPLACE FUNCTION public.message_project(_mid uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_id FROM public.messages WHERE id = _mid;
$$;

CREATE POLICY "reads insert own" ON public.message_reads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.message_author(message_id) <> auth.uid()
  AND public.can_view_project(public.message_project(message_id), auth.uid()));
CREATE POLICY "reads view" ON public.message_reads FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.message_author(message_id) = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;

DROP POLICY IF EXISTS "versions delete" ON public.project_versions;
CREATE POLICY "versions delete" ON public.project_versions FOR DELETE TO authenticated
USING (auth.uid() = author_id OR public.is_project_owner(project_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_last_version_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.projects WHERE id = OLD.project_id)
     AND (SELECT count(*) FROM public.project_versions WHERE project_id = OLD.project_id) <= 1
     AND pg_trigger_depth() = 1 THEN
    RAISE EXCEPTION 'Impossible de supprimer la seule version du projet';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER versions_keep_one BEFORE DELETE ON public.project_versions
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_version_delete();