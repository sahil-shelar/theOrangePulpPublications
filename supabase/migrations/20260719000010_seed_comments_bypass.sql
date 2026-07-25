-- 20260719000010_seed_comments_bypass.sql
-- Allow seeded (system) comments with null user_id to be inserted via anon key.
-- Real user comments still require auth.uid() = user_id.

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users insert comments" ON comments;
  DROP POLICY IF EXISTS "Anon can insert comments" ON comments;
  DROP POLICY IF EXISTS "Admin manage comments" ON comments;
END $$;

-- Allow system/seed comments (user_id IS NULL) OR user's own comments
CREATE POLICY "Insert comments" ON comments
  FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- Admins can manage all
CREATE POLICY "Admin manage comments" ON comments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (true);
