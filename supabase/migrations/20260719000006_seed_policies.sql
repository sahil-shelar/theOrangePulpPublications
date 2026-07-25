-- 20260719000006_seed_policies.sql
-- Adds permissive INSERT/UPDATE policies for seeding via the service role key.
-- Note: The service role key BYPASSES RLS entirely, so these are for anon/authenticated CLI seeds.

-- Drop any existing conflicting policies before creating
DO $$ BEGIN
  -- categories
  DROP POLICY IF EXISTS "Authenticated can insert categories" ON categories;
  DROP POLICY IF EXISTS "Authenticated can upsert categories" ON categories;
  DROP POLICY IF EXISTS "Public read categories" ON categories;
  -- tags
  DROP POLICY IF EXISTS "Authenticated can insert tags" ON tags;
  DROP POLICY IF EXISTS "Authenticated can upsert tags" ON tags;
  DROP POLICY IF EXISTS "Public read tags" ON tags;
  -- authors
  DROP POLICY IF EXISTS "Authenticated can insert authors" ON authors;
  DROP POLICY IF EXISTS "Authenticated can update authors" ON authors;
  DROP POLICY IF EXISTS "Public read authors" ON authors;
  -- movies
  DROP POLICY IF EXISTS "Authenticated can insert movies" ON movies;
  DROP POLICY IF EXISTS "Authenticated can update movies" ON movies;
  DROP POLICY IF EXISTS "Public read movies" ON movies;
  -- articles
  DROP POLICY IF EXISTS "Authenticated can insert articles" ON articles;
  DROP POLICY IF EXISTS "Authenticated can update articles" ON articles;
  -- article_tags
  DROP POLICY IF EXISTS "Authenticated insert article_tags" ON article_tags;
  DROP POLICY IF EXISTS "Public read article_tags" ON article_tags;
  -- newsletter_subscribers
  DROP POLICY IF EXISTS "Authenticated insert newsletter_subscribers" ON newsletter_subscribers;
  -- ad_slots
  DROP POLICY IF EXISTS "Authenticated manage ad_slots" ON ad_slots;
  -- page_views
  DROP POLICY IF EXISTS "Authenticated insert page_views" ON page_views;
END $$;

-- Enable RLS on tables that may not have it yet
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read authors" ON authors FOR SELECT USING (true);
CREATE POLICY "Public read movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Public read article_tags" ON article_tags FOR SELECT USING (true);

-- Authenticated write access (for seeding and admin operations)
CREATE POLICY "Authenticated can insert categories" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can upsert categories" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert tags" ON tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can upsert tags" ON tags
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert authors" ON authors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update authors" ON authors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert movies" ON movies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update movies" ON movies
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert articles" ON articles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update articles" ON articles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert article_tags" ON article_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert newsletter_subscribers" ON newsletter_subscribers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert page_views" ON page_views
  FOR INSERT WITH CHECK (true);
