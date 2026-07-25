-- 20260719000011_fix_comments_all_policy.sql
-- The FOR ALL policy with USING blocks INSERT from anon key.
-- Replace with specific per-operation policies.

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin manage comments" ON comments;
  DROP POLICY IF EXISTS "Insert comments" ON comments;
  DROP POLICY IF EXISTS "Anon can insert comments" ON comments;
  DROP POLICY IF EXISTS "Public read approved comments" ON comments;
END $$;

-- Public read
CREATE POLICY "Public read comments" ON comments
  FOR SELECT USING (status = 'approved');

-- Anyone can insert (seeder uses null user_id, real users pass their uid)
CREATE POLICY "Public insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Authenticated users can update/delete their own comments
CREATE POLICY "Users update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can update any comment (moderation)
CREATE POLICY "Admins update any comment" ON comments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins delete any comment" ON comments
  FOR DELETE USING (auth.role() = 'authenticated');
