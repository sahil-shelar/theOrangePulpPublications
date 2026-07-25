-- 20260719000009_fix_comments_rls.sql
-- Allow anon inserts on comments and newsletter_subscribers for seeding

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read approved comments" ON comments;
  DROP POLICY IF EXISTS "Users insert comments" ON comments;
  DROP POLICY IF EXISTS "Admin manage comments" ON comments;
  DROP POLICY IF EXISTS "Anon can insert newsletter_subscribers" ON newsletter_subscribers;
  DROP POLICY IF EXISTS "Public insert newsletter_subscribers" ON newsletter_subscribers;
END $$;

-- Comments: allow anon inserts (seeding only — no user_id required)
CREATE POLICY "Anon can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read approved comments" ON comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Admin manage comments" ON comments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (true);

-- Newsletter subscribers: anon can subscribe
CREATE POLICY "Public insert newsletter_subscribers" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read newsletter_subscribers" ON newsletter_subscribers
  FOR SELECT USING (true);
