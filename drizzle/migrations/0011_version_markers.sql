CREATE TABLE public.version_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.project_versions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  time_sec real NOT NULL CHECK (time_sec >= 0),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX version_markers_version_idx ON public.version_markers(version_id, time_sec);
CREATE INDEX version_markers_project_created_idx ON public.version_markers(project_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.version_markers TO authenticated;
GRANT ALL ON public.version_markers TO service_role;
ALTER TABLE public.version_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "markers view" ON public.version_markers
  FOR SELECT TO authenticated
  USING (public.can_view_project(project_id, auth.uid()));

CREATE POLICY "markers insert" ON public.version_markers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.can_view_project(project_id, auth.uid()));

CREATE POLICY "markers delete" ON public.version_markers
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_project_owner(project_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_version_marker()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.project_versions v
    WHERE v.id = NEW.version_id AND v.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'La version ne correspond pas au projet';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER version_markers_validate
BEFORE INSERT OR UPDATE OF project_id, version_id
ON public.version_markers
FOR EACH ROW
EXECUTE FUNCTION public.validate_version_marker();

REVOKE ALL ON FUNCTION public.validate_version_marker() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_version_marker() FROM anon;
REVOKE ALL ON FUNCTION public.validate_version_marker() FROM authenticated;
