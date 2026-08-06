-- Generated rankings are produced by a deterministic TMDB query, so re-running
-- the same topic returns the same films in the same order. "10 best horror
-- movies part 2" would therefore have duplicated part one exactly.
--
-- query_signature is a canonical string describing the constraints a ranking was
-- built from (genres, provider, director, year range, ordering — deliberately NOT
-- the count or the part number). A part-2 run looks up earlier articles with the
-- same signature and excludes every film they already used.
--
-- Null for hand-authored articles; only the generator writes it.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS query_signature TEXT;

COMMENT ON COLUMN articles.query_signature IS
  'Canonical constraints of the generated query. Used to exclude already-featured films from later parts of the same list. Null for hand-authored articles.';

-- Partial index: the lookup is always "earlier articles with this signature", and
-- the column is null for everything an editor wrote by hand.
CREATE INDEX IF NOT EXISTS idx_articles_query_signature
  ON articles(query_signature, created_at DESC)
  WHERE query_signature IS NOT NULL;
