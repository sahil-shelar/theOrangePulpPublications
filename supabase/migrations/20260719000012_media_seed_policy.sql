-- Allow anon/seed scripts to insert media entries
-- The media table only has authenticated write access; add an open seed policy.

DROP POLICY IF EXISTS "Anon can insert media" ON media;

CREATE POLICY "Anon can insert media" ON media
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can update media" ON media
  FOR UPDATE USING (true);
