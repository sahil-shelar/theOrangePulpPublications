-- Template-aware article types: give News, Review, List, Spotlight their own
-- structured fields/tables instead of one generic title+content blob.

-- ── News ──────────────────────────────────────────────────────────────────
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS subheadline  TEXT,
  ADD COLUMN IF NOT EXISTS source_name  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_url   TEXT;

-- ── Review ────────────────────────────────────────────────────────────────
-- `rating` (existing, 0-5) is the OP score. These add the rest of the breakdown.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS imdb_score DECIMAL(3,1),   -- out of 10
  ADD COLUMN IF NOT EXISTS rt_score   INTEGER,         -- out of 100
  ADD COLUMN IF NOT EXISTS verdict    VARCHAR(20);     -- must_watch | recommended | mixed | skip

-- ── Spotlight ─────────────────────────────────────────────────────────────
-- Bio header fields for the profile subject (person). No separate `people`
-- table yet — /person/[slug] remains its own future effort.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS subject_name       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subject_role       VARCHAR(100),  -- Director, Actor, etc.
  ADD COLUMN IF NOT EXISTS subject_photo_url  TEXT,
  ADD COLUMN IF NOT EXISTS pull_quote         TEXT;

-- ── List (rankings) ───────────────────────────────────────────────────────
-- Replaces the old metadata/markdown-regex hack with real ranked rows.
CREATE TABLE IF NOT EXISTS list_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  rank         INTEGER NOT NULL,
  movie_id     UUID REFERENCES movies(id) ON DELETE SET NULL,
  custom_title VARCHAR(255),   -- used when no movie_id (unlisted title)
  blurb        TEXT,
  item_rating  DECIMAL(3,1),   -- optional per-item score, out of 5
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, rank)
);

-- ── Spotlight notable works ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spotlight_works (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  rank         INTEGER NOT NULL,
  movie_id     UUID REFERENCES movies(id) ON DELETE SET NULL,
  custom_title VARCHAR(255),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_list_items_article_id ON list_items(article_id);
CREATE INDEX IF NOT EXISTS idx_spotlight_works_article_id ON spotlight_works(article_id);

ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotlight_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read list_items of published articles" ON list_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = list_items.article_id AND articles.status = 'published')
  );
CREATE POLICY "Authenticated manage list_items" ON list_items
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read spotlight_works of published articles" ON spotlight_works
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = spotlight_works.article_id AND articles.status = 'published')
  );
CREATE POLICY "Authenticated manage spotlight_works" ON spotlight_works
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
