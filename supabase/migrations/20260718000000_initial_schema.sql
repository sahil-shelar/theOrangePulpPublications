-- Create ENUMs for strong typing
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE article_type AS ENUM ('news', 'review', 'spotlight', 'list');

-- 1. Authors Table
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_categories_slug ON categories(slug);

-- 3. Tags Table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tags_slug ON tags(slug);

-- 4. Movies Table (Prepared for future TMDb integration)
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    tmdb_id INTEGER UNIQUE, -- Nullable until integrated
    release_year INTEGER,
    director VARCHAR(255),
    poster_url TEXT,
    backdrop_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extended TMDb data flexibly
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);

-- 5. Media Table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    alt_text TEXT,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES authors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Articles Table (Core entity)
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT, -- Markdown or HTML
    cover_image_url TEXT,
    featured_image_url TEXT,
    status article_status NOT NULL DEFAULT 'draft',
    type article_type NOT NULL DEFAULT 'news',
    
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES movies(id) ON DELETE SET NULL, -- Used for reviews
    
    rating DECIMAL(3,1), -- Out of 10.0 or 5.0
    is_featured BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0,
    reading_time INTEGER, -- In minutes
    
    seo_title VARCHAR(255),
    seo_description TEXT,
    og_image_url TEXT,
    
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for highly scalable searching and filtering
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_type ON articles(type);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_movie ON articles(movie_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;

-- 7. ArticleTags (Many-to-Many Relationship)
CREATE TABLE article_tags (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- 8. Newsletter Subscribers Table
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);

-- 9. Site Settings Table (Key-Value configuration for dynamic homepage/ads)
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_site_settings_key ON site_settings(key);


-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_authors_modtime
    BEFORE UPDATE ON authors
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_movies_modtime
    BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_articles_modtime
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_site_settings_modtime
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
