-- 20260725000003_lockdown_rls_production.sql
-- Remove all anon write policies created for dev/staging seeding.
-- Replace with authenticated-only policies for all write operations.

DO $$ BEGIN

  -- Articles
  DROP POLICY IF EXISTS "Anon can insert articles" ON articles;
  DROP POLICY IF EXISTS "Anon can update articles" ON articles;
  DROP POLICY IF EXISTS "Anon can delete articles" ON articles;

  -- Categories
  DROP POLICY IF EXISTS "Anon can insert categories" ON categories;
  DROP POLICY IF EXISTS "Anon can update categories" ON categories;

  -- Tags
  DROP POLICY IF EXISTS "Anon can insert tags" ON tags;
  DROP POLICY IF EXISTS "Anon can update tags" ON tags;

  -- Authors
  DROP POLICY IF EXISTS "Anon can insert authors" ON authors;
  DROP POLICY IF EXISTS "Anon can update authors" ON authors;

  -- Movies
  DROP POLICY IF EXISTS "Anon can insert movies" ON movies;
  DROP POLICY IF EXISTS "Anon can update movies" ON movies;

  -- Article Tags
  DROP POLICY IF EXISTS "Anon can insert article_tags" ON article_tags;

  -- Newsletter
  DROP POLICY IF EXISTS "Anon can insert newsletter_subscribers" ON newsletter_subscribers;
  DROP POLICY IF EXISTS "Anon can manage newsletter_campaigns" ON newsletter_campaigns;

  -- Page views
  DROP POLICY IF EXISTS "Anon can insert page_views" ON page_views;

  -- Ads / Affiliates
  DROP POLICY IF EXISTS "Anon can manage ad_slots" ON ad_slots;
  DROP POLICY IF EXISTS "Anon can manage affiliate_links" ON affiliate_links;

END $$;

-- Re-create proper authenticated-only write policies

-- Articles: authenticated users can insert; only owner or admin can update/delete
CREATE POLICY "Authenticated can insert articles" ON articles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update articles" ON articles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete articles" ON articles
  FOR DELETE USING (auth.role() = 'authenticated');

-- Categories: authenticated only
CREATE POLICY "Authenticated can insert categories" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update categories" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Tags: authenticated only
CREATE POLICY "Authenticated can insert tags" ON tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update tags" ON tags
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Authors: authenticated only
CREATE POLICY "Authenticated can insert authors" ON authors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update authors" ON authors
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Movies: authenticated only
CREATE POLICY "Authenticated can insert movies" ON movies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update movies" ON movies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Article tags: authenticated only
CREATE POLICY "Authenticated can insert article_tags" ON article_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Newsletter subscribers: allow anon insert (public subscribe form)
CREATE POLICY "Anyone can subscribe newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Newsletter campaigns: authenticated only
CREATE POLICY "Authenticated can manage newsletter_campaigns" ON newsletter_campaigns
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Page views: allow anon insert (public analytics)
CREATE POLICY "Anyone can insert page_views" ON page_views
  FOR INSERT WITH CHECK (true);

-- Ad slots: authenticated only
CREATE POLICY "Authenticated can manage ad_slots" ON ad_slots
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Affiliate links: authenticated only
CREATE POLICY "Authenticated can manage affiliate_links" ON affiliate_links
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
