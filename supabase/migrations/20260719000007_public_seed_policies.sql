-- 20260719000007_public_seed_policies.sql
-- Temporarily open write access for anon key seeding.
-- These are development/staging policies. In production, lock these down.

-- Drop existing authenticated-only policies to replace with anon-friendly ones
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can insert categories" ON categories;
  DROP POLICY IF EXISTS "Authenticated can upsert categories" ON categories;
  DROP POLICY IF EXISTS "Authenticated can insert tags" ON tags;
  DROP POLICY IF EXISTS "Authenticated can upsert tags" ON tags;
  DROP POLICY IF EXISTS "Authenticated can insert authors" ON authors;
  DROP POLICY IF EXISTS "Authenticated can update authors" ON authors;
  DROP POLICY IF EXISTS "Authenticated can insert movies" ON movies;
  DROP POLICY IF EXISTS "Authenticated can update movies" ON movies;
  DROP POLICY IF EXISTS "Authenticated can insert articles" ON articles;
  DROP POLICY IF EXISTS "Authenticated can update articles" ON articles;
  DROP POLICY IF EXISTS "Authenticated insert article_tags" ON article_tags;
  DROP POLICY IF EXISTS "Authenticated insert newsletter_subscribers" ON newsletter_subscribers;
  DROP POLICY IF EXISTS "Authenticated insert page_views" ON page_views;
  DROP POLICY IF EXISTS "Admin manage ads" ON ad_slots;
  DROP POLICY IF EXISTS "Admin manage affiliates" ON affiliate_links;
  DROP POLICY IF EXISTS "Admin manage newsletters" ON newsletter_campaigns;
END $$;

-- Open write policies (anon key — for dev/staging seeding)
CREATE POLICY "Anon can insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Anon can insert tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update tags" ON tags FOR UPDATE USING (true);
CREATE POLICY "Anon can insert authors" ON authors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update authors" ON authors FOR UPDATE USING (true);
CREATE POLICY "Anon can insert movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update movies" ON movies FOR UPDATE USING (true);
CREATE POLICY "Anon can insert articles" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update articles" ON articles FOR UPDATE USING (true);
CREATE POLICY "Anon can delete articles" ON articles FOR DELETE USING (true);
CREATE POLICY "Anon can insert article_tags" ON article_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert newsletter_subscribers" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can manage ad_slots" ON ad_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon can manage newsletter_campaigns" ON newsletter_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon can manage affiliate_links" ON affiliate_links FOR ALL USING (true) WITH CHECK (true);

-- Also add unique constraint on authors.name to support upsert
ALTER TABLE authors ADD COLUMN IF NOT EXISTS username VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_authors_name_unique ON authors(name);
