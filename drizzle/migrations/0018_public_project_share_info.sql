-- Function to securely fetch share metadata (cover, title, owner, version count)
-- for any project by ID, without requiring authentication or exposing private stems/messages.
CREATE OR REPLACE FUNCTION public.get_project_share_info(_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'description', p.description,
    'help_needed', p.help_needed,
    'genre', p.genre,
    'bpm', p.bpm,
    'musical_key', p.musical_key,
    'cover_url', p.cover_url,
    'created_at', p.created_at,
    'owner_name', COALESCE(NULLIF(trim(prof.display_name), ''), prof.username, 'Producteur'),
    'owner_username', COALESCE(prof.username, 'producer'),
    'owner_avatar_url', prof.avatar_url,
    'version_count', COALESCE((SELECT COUNT(*)::int FROM public.project_versions pv WHERE pv.project_id = p.id), 1),
    'latest_version_number', COALESCE((SELECT MAX(pv.version_number)::int FROM public.project_versions pv WHERE pv.project_id = p.id), 1)
  ) INTO result
  FROM public.projects p
  LEFT JOIN public.profiles prof ON prof.id = p.owner_id
  WHERE p.id = _project_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_project_share_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_share_info(uuid) TO anon, authenticated, service_role;
