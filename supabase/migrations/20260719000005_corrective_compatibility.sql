-- 20260719000005_corrective_compatibility.sql
-- Restoring backwards compatibility for PostgREST by removing ambiguous Foreign Keys.

-- 1. Fix authors(*) resolution in articles:
-- The editorial workflow added two new foreign keys to authors (assignee_id, reviewer_id)
-- This caused ambiguity when querying articles.select('..., authors(*)').
-- We drop the database-level constraints to restore PostgREST resolution to author_id.
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_assignee_id_fkey;
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_reviewer_id_fkey;

-- 2. Fix movies(*) resolution in articles:
-- affiliate_links created a many-to-many junction between articles and movies.
-- This caused ambiguity when querying articles.select('..., movies(*)').
-- We drop the database-level constraint on movie_id to prevent PostgREST from detecting the M2M.
ALTER TABLE affiliate_links DROP CONSTRAINT IF EXISTS affiliate_links_movie_id_fkey;
