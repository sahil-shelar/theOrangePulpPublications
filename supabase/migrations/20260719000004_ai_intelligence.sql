-- Phase 16: AI Editorial Intelligence Schema

CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(50) NOT NULL, -- 'article', 'movie', 'seo', 'trend'
    target_id UUID, -- Can be article_id, movie_id, etc.
    suggestion_type VARCHAR(100) NOT NULL, -- 'rewrite', 'seo_title', 'internal_link', 'coverage_gap', 'image_alt'
    content JSONB NOT NULL, -- The actual suggestion data
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS movie_coverage_plans (
    movie_id UUID PRIMARY KEY REFERENCES movies(id) ON DELETE CASCADE,
    has_trailer_article BOOLEAN DEFAULT false,
    has_cast_guide BOOLEAN DEFAULT false,
    has_ending_explained BOOLEAN DEFAULT false,
    has_review BOOLEAN DEFAULT false,
    has_box_office BOOLEAN DEFAULT false,
    has_streaming_guide BOOLEAN DEFAULT false,
    has_where_to_watch BOOLEAN DEFAULT false,
    has_post_credits BOOLEAN DEFAULT false,
    has_ranking BOOLEAN DEFAULT false,
    has_timeline BOOLEAN DEFAULT false,
    ai_priority_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 0,
    missing_elements JSONB,
    suggestions JSONB,
    last_audited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trend_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(255) NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'tmdb', 'google_trends', 'internal_search'
    opportunity_score INTEGER DEFAULT 0,
    suggested_angles JSONB,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'assigned', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_coverage_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies (Admins and Editors only)
CREATE POLICY "Editors manage AI suggestions" ON ai_suggestions USING (auth.role() = 'authenticated');
CREATE POLICY "Editors manage coverage plans" ON movie_coverage_plans USING (auth.role() = 'authenticated');
CREATE POLICY "Editors manage SEO audits" ON seo_audits USING (auth.role() = 'authenticated');
CREATE POLICY "Editors manage trend opportunities" ON trend_opportunities USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_target ON ai_suggestions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_article_id ON seo_audits(article_id);
CREATE INDEX IF NOT EXISTS idx_trend_opportunities_status ON trend_opportunities(status);
