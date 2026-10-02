CREATE OR REPLACE FUNCTION public.validate_stem_request_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.version_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.project_versions v
    WHERE v.id = NEW.version_id
      AND v.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'La version ne correspond pas au projet';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stem_requests_validate_version
BEFORE INSERT OR UPDATE OF project_id, version_id
ON public.stem_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_stem_request_version();

REVOKE ALL ON FUNCTION public.validate_stem_request_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_stem_request_version() FROM anon;
REVOKE ALL ON FUNCTION public.validate_stem_request_version() FROM authenticated;