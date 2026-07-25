-- Create required storage buckets (public = true so <img> tags can serve them directly)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('article-images',  'article-images',  true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/avif']),
  ('author-avatars',  'author-avatars',  true, 5242880,  ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('movie-posters',   'movie-posters',   true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('movie-backdrops', 'movie-backdrops', true, 15728640, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('site-assets',     'site-assets',     true, 5242880,  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: allow authenticated users to upload to all buckets
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload'
  ) THEN
    CREATE POLICY "Authenticated users can upload"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Storage RLS: allow public read on all buckets
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Public read all buckets'
  ) THEN
    CREATE POLICY "Public read all buckets"
      ON storage.objects FOR SELECT TO public
      USING (true);
  END IF;
END $$;

-- Storage RLS: allow authenticated users to delete their own uploads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated users can delete'
  ) THEN
    CREATE POLICY "Authenticated users can delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (auth.role() = 'service_role');
  END IF;
END $$;
