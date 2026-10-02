ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS help_needed text;
GRANT UPDATE ON public.project_versions TO authenticated;
CREATE POLICY "versions update" ON public.project_versions FOR UPDATE TO authenticated
USING ((auth.uid() = author_id) OR public.is_project_owner(project_id, auth.uid()))
WITH CHECK ((auth.uid() = author_id) OR public.is_project_owner(project_id, auth.uid()));
CREATE OR REPLACE FUNCTION public.lock_version_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.id := OLD.id; NEW.project_id := OLD.project_id; NEW.author_id := OLD.author_id;
  NEW.version_number := OLD.version_number; NEW.audio_url := OLD.audio_url;
  NEW.peaks := OLD.peaks; NEW.duration := OLD.duration; NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;
CREATE TRIGGER lock_version_fields BEFORE UPDATE ON public.project_versions FOR EACH ROW EXECUTE FUNCTION public.lock_version_fields();