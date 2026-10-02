-- Fix public showcase media for anonymous visitors.
-- The combined storage policy called can_read_media even for anon; Postgres
-- checks EXECUTE on that function and denied access ("permission denied for
-- function can_read_media"), so avatars/covers/audio failed on /u/$username
-- when logged out. Split policies so anon only uses is_showcase_media.

DROP POLICY IF EXISTS "media read" ON storage.objects;

CREATE POLICY "media read authenticated" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id IN ('avatars', 'covers', 'audio')
  AND public.can_read_media(bucket_id, name, auth.uid())
);

CREATE POLICY "media read showcase" ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id IN ('avatars', 'covers', 'audio')
  AND public.is_showcase_media(bucket_id, name)
);

-- Ensure anon can evaluate the showcase helper used by the policy above
GRANT EXECUTE ON FUNCTION public.is_showcase_media(text, text) TO anon, authenticated;
-- Authenticated-only helper (not required for anon after the split)
REVOKE ALL ON FUNCTION public.can_read_media(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_media(text, text, uuid) TO authenticated;
