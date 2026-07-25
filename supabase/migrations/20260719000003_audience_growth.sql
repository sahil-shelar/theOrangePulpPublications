-- Phase 15: Revenue, Audience & Growth Schema

-- Advertising System
CREATE TABLE IF NOT EXISTS ad_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slot_key VARCHAR(100) UNIQUE NOT NULL,
    ad_type VARCHAR(50) DEFAULT 'custom_html', -- adsense, custom_html, image
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    device_targeting VARCHAR(50) DEFAULT 'all', -- all, desktop, mobile
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    revenue_generated DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate System
CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Accounts & History
CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

CREATE TABLE IF NOT EXISTS user_reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0
);

-- Community (Comments & Ratings)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved', -- approved, pending, spam, deleted
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_ratings (
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (movie_id, user_id)
);

-- Newsletter Campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    open_rate DECIMAL(5, 2) DEFAULT 0,
    click_rate DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics & Tracking
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(255) NOT NULL,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255),
    referrer VARCHAR(255),
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update Articles for Content Performance
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_generated DECIMAL(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS last_indexed_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public read ads" ON ad_slots FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage ads" ON ad_slots USING (auth.role() = 'authenticated');

CREATE POLICY "Public read affiliates" ON affiliate_links FOR SELECT USING (true);
CREATE POLICY "Admin manage affiliates" ON affiliate_links USING (auth.role() = 'authenticated');

CREATE POLICY "Users read own bookmarks" ON user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bookmarks" ON user_bookmarks USING (auth.uid() = user_id);

CREATE POLICY "Users read own history" ON user_reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own history" ON user_reading_history USING (auth.uid() = user_id);

CREATE POLICY "Public read approved comments" ON comments FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Users insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage comments" ON comments USING (auth.role() = 'authenticated');

CREATE POLICY "Public read movie ratings" ON movie_ratings FOR SELECT USING (true);
CREATE POLICY "Users manage own movie ratings" ON movie_ratings USING (auth.uid() = user_id);

CREATE POLICY "Admin manage newsletters" ON newsletter_campaigns USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_page_views_article_id ON page_views(article_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
