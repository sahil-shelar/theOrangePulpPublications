-- 20260719000008_fix_page_views_rls.sql
-- Fix page_views and ad_slots to allow anon inserts for seeding and analytics tracking

DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated insert page_views" ON page_views;
  DROP POLICY IF EXISTS "Anon can insert page_views" ON page_views;
  DROP POLICY IF EXISTS "Anon can manage ad_slots" ON ad_slots;
  DROP POLICY IF EXISTS "Anon can manage newsletter_campaigns" ON newsletter_campaigns;
  DROP POLICY IF EXISTS "Anon can manage affiliate_links" ON affiliate_links;
  DROP POLICY IF EXISTS "Anon can insert newsletter_subscribers" ON newsletter_subscribers;
END $$;

-- page_views: anyone can insert (needed for real-time analytics tracking + seeding)
CREATE POLICY "Public insert page_views" ON page_views
  FOR INSERT WITH CHECK (true);

-- ad_slots: full access (dev/staging)
CREATE POLICY "Public manage ad_slots" ON ad_slots
  FOR ALL USING (true) WITH CHECK (true);

-- newsletter_campaigns: full access (dev/staging)
CREATE POLICY "Public manage newsletter_campaigns" ON newsletter_campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- affiliate_links: full access (dev/staging)
CREATE POLICY "Public manage affiliate_links" ON affiliate_links
  FOR ALL USING (true) WITH CHECK (true);

-- newsletter_subscribers: allow inserts
CREATE POLICY "Public insert newsletter_subscribers" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);
