-- Partition articles by the environment they were written in.
--
-- The dev server and the deployed site share one Supabase project, so anything
-- written against localhost:3000 was immediately live on production. That is how
-- 350 seeded demo articles ended up published with no cover images.
--
--   'production' — written by the deployed site, or promoted there by an editor
--   'local'      — written from localhost or a Vercel preview deployment
--   'seed'       — written by `npm run seed`
--
-- Public reads on production return 'production' only; every other environment
-- shows all three. See src/lib/data-origin.ts — the filter is applied in the
-- application, not in RLS, because both environments authenticate with the same
-- anon key and a policy cannot tell them apart.
--
-- DELIBERATELY NO DEFAULT. Every insert path names `origin` explicitly
-- (the article editor, both generators, the seeder). Without a default, a path
-- that forgets fails loudly at insert time instead of silently guessing an
-- environment — and guessing wrong in either direction is the bug this column
-- exists to prevent.
--
-- APPLYING THIS MIGRATION ALONE CHANGES NOTHING VISIBLE. Existing rows are all
-- set to 'production', which is exactly what production shows today. Removing
-- the seeded articles from production is a separate, reviewable step:
--
--     npm run backfill:origins              # dry run, reports what it would do
--     npm run backfill:origins -- --apply   # reclassifies seeded rows to 'seed'

ALTER TABLE articles ADD COLUMN IF NOT EXISTS origin TEXT;

-- Everything that exists today is visible on production today. Preserve that,
-- and let the backfill script decide which of these rows are actually seed data.
UPDATE articles SET origin = 'production' WHERE origin IS NULL;

ALTER TABLE articles ALTER COLUMN origin SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE articles
    ADD CONSTRAINT articles_origin_check CHECK (origin IN ('production', 'local', 'seed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN articles.origin IS
  'Environment this row was written in: production | local | seed. Public reads on production return production rows only. Set explicitly by every insert path; there is no default.';

-- Matches the shape of every public listing query: origin + status, newest first.
CREATE INDEX IF NOT EXISTS idx_articles_origin_status_published
  ON articles(origin, status, published_at DESC);
