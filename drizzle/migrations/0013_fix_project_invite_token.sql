CREATE OR REPLACE FUNCTION public.get_or_create_project_invite(_project_id uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
DECLARE uid uuid := auth.uid(); t text;
BEGIN
  IF uid IS NULL OR NOT public.is_project_owner(_project_id, uid) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  SELECT token INTO t FROM public.project_invites WHERE project_id = _project_id AND revoked_at IS NULL;
  IF t IS NOT NULL THEN RETURN t; END IF;
  INSERT INTO public.project_invites(project_id, created_by, token)
  VALUES (_project_id, uid, encode(extensions.gen_random_bytes(18), 'hex'))
  ON CONFLICT (project_id) DO UPDATE
    SET token = encode(extensions.gen_random_bytes(18), 'hex'), revoked_at = NULL, created_by = uid, created_at = now()
  RETURNING token INTO t;
  RETURN t;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.get_or_create_project_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_project_invite(uuid) TO authenticated;