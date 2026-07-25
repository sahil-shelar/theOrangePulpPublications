-- Fix 1: movies — add columns required by TMDb import flow and /movie/[slug] page
ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS slug            VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS synopsis        TEXT,
  ADD COLUMN IF NOT EXISTS original_title  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS trailer_url     TEXT,
  ADD COLUMN IF NOT EXISTS certification   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS release_date    DATE;

CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);

-- Fix 2: authors — add slug (needed by /author/[slug] page and getAuthorBySlug)
ALTER TABLE authors
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);

-- Fix 3: atomic view count RPC — replaces non-atomic read+write in incrementViewCount
CREATE OR REPLACE FUNCTION increment_view_count(article_id UUID)
RETURNS VOID AS $$
  UPDATE articles
  SET views_count = views_count + 1
  WHERE id = article_id;
$$ LANGUAGE sql SECURITY DEFINER;
