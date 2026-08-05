-- Full-text search for articles.
--
-- Before this, search ran `to_tsvector(title) @@ websearch_to_tsquery(q)` with
-- no index (the pg_trgm index in 20260719000001 was left commented out), and
-- covered `title` only. Two consequences: body/excerpt terms never matched,
-- and websearch_to_tsquery matches whole words only, so an as-you-type query
-- like "odys" returned nothing until the full word was typed.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')),       'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')),     'B') ||
    setweight(to_tsvector('english', coalesce(subheadline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(subject_name, '')),'B') ||
    setweight(to_tsvector('english', coalesce(content, '')),     'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_articles_search_vector
  ON articles USING GIN (search_vector);

-- Trigram index on title as well, so ILIKE '%q%' substring lookups (used by
-- the movie search in /api/search) stop being sequential scans.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
  ON articles USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_movies_title_trgm
  ON movies USING GIN (title gin_trgm_ops);
