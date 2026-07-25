-- Enable Row Level Security
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 1. Authors
CREATE POLICY "Authors are readable by everyone" ON authors FOR SELECT USING (true);
CREATE POLICY "Authors are manageable by authenticated users" ON authors USING (auth.role() = 'authenticated');

-- 2. Categories
CREATE POLICY "Categories are readable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Categories are manageable by authenticated users" ON categories USING (auth.role() = 'authenticated');

-- 3. Tags
CREATE POLICY "Tags are readable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Tags are manageable by authenticated users" ON tags USING (auth.role() = 'authenticated');

-- 4. Movies
CREATE POLICY "Movies are readable by everyone" ON movies FOR SELECT USING (true);
CREATE POLICY "Movies are manageable by authenticated users" ON movies USING (auth.role() = 'authenticated');

-- 5. Media
CREATE POLICY "Media is readable by everyone" ON media FOR SELECT USING (true);
CREATE POLICY "Media is manageable by authenticated users" ON media USING (auth.role() = 'authenticated');

-- 6. Articles
-- Only published articles are readable by everyone. Drafts/Archived only by authenticated.
CREATE POLICY "Published articles are readable by everyone" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "All articles are readable by authenticated users" ON articles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Articles are manageable by authenticated users" ON articles USING (auth.role() = 'authenticated');

-- 7. Article Tags
CREATE POLICY "Article tags are readable by everyone" ON article_tags FOR SELECT USING (true);
CREATE POLICY "Article tags are manageable by authenticated users" ON article_tags USING (auth.role() = 'authenticated');

-- 8. Newsletter Subscribers
CREATE POLICY "Subscribers can insert themselves" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Subscribers are manageable by authenticated users" ON newsletter_subscribers USING (auth.role() = 'authenticated');

-- 9. Site Settings
CREATE POLICY "Site settings are readable by everyone" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Site settings are manageable by authenticated users" ON site_settings USING (auth.role() = 'authenticated');

-- 10. Jobs
CREATE POLICY "Jobs are only readable by authenticated users" ON jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Jobs are manageable by authenticated users" ON jobs USING (auth.role() = 'authenticated');

-- Storage Bucket Policies (Assuming a 'media' bucket exists)
-- Note: These would run against the storage.objects table, but typical Supabase setup uses the dashboard.
-- We will write them out for completeness.
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
-- CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT USING (bucket_id = 'media' AND auth.role() = 'authenticated');
