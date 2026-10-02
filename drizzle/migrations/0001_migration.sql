DROP POLICY "media read" ON storage.objects;
CREATE POLICY "media read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('avatars','covers','audio'));