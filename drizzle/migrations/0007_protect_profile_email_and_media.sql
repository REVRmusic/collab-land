REVOKE SELECT ON public.profiles FROM authenticated, anon;
GRANT SELECT (id, username, display_name, avatar_url, bio, email_digest, created_at) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.can_read_media(_bucket text, _name text, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND (
    split_part(_name, '/', 1) = _uid::text
    OR _bucket = 'avatars'
    OR (_bucket = 'covers' AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.cover_url = _name AND can_view_project(p.id, _uid))
      OR EXISTS (SELECT 1 FROM covers c WHERE c.image_url = _name AND can_view_project(c.project_id, _uid))))
    OR (_bucket = 'audio' AND (
      EXISTS (SELECT 1 FROM project_versions v WHERE v.audio_url = _name AND can_view_project(v.project_id, _uid))
      OR EXISTS (SELECT 1 FROM messages m WHERE m.audio_url = _name AND can_view_project(m.project_id, _uid))))
  );
$$;

DROP POLICY IF EXISTS "media read" ON storage.objects;
CREATE POLICY "media read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('avatars','covers','audio') AND public.can_read_media(bucket_id, name, auth.uid()));