-- Create advanced indexes for performance

-- Index for searching articles by status and type
CREATE INDEX IF NOT EXISTS idx_articles_status_type ON articles(status, type);

-- Index for ordering latest articles
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc ON articles(published_at DESC);

-- Index for trending metrics
CREATE INDEX IF NOT EXISTS idx_articles_views_count ON articles(views_count DESC);

-- Index for recommending by category and tag
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);

-- GIN index for search across titles (requires pg_trgm for full text, but we use ILIKE so we can use a basic or GIN)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING GIN (title gin_trgm_ops);

-- Optimize jobs engine
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON jobs(status, priority DESC);
