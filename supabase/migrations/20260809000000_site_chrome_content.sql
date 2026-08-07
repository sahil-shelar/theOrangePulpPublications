-- Make the site chrome content-driven: navigation and the homepage section
-- furniture, which were hardcoded arrays in components.
--
--   Navbar.tsx:9      NAV_LINKS          -> nav_links (location 'header')
--   Footer.tsx:4,11   EXPLORE, COMPANY   -> nav_links (footer_* locations)
--   page.tsx:50-154   section headers    -> home_sections (kind 'header')
--   page.tsx:73-76    promo cards        -> home_sections (kind 'promo')
--
-- SEEDED WITH THE EXACT CURRENT VALUES. Deploying this changes nothing visible;
-- it only moves where the values live. That is deliberate — the components fall
-- back to their existing constants when a query returns nothing, so the site
-- renders identically whether or not this migration has been applied.
--
-- Not included, and why:
--
--   * Static pages (about/terms/privacy/contact). Legal and marketing copy that
--     changes maybe twice a year. A table plus a /[slug] route plus redirects
--     from four working routes buys very little and adds an editing surface to
--     documents that should change slowly and deliberately.
--   * Ad slots. An `ad_slots` table already exists (20260719000003) and the app
--     has never read it — src/config/ads.ts duplicates its purpose. But the two
--     do not line up: the table has name/slot_key/ad_type/content/device_targeting
--     while the config carries width/height/label/responsive/slotId. Reconciling
--     them means either widening the table or stuffing dimensions into `content`,
--     which is a schema decision rather than a mechanical migration.

-- ── Navigation ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- One table serves the header and both footer columns. Splitting them into
  -- three tables would triple the read path for what is one concept.
  location    VARCHAR(32) NOT NULL CHECK (location IN ('header', 'footer_explore', 'footer_company')),
  label       VARCHAR(100) NOT NULL,
  href        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_visible  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- The same destination twice in one menu is always a mistake, and this makes
  -- the seed below re-runnable.
  UNIQUE (location, href)
);

CREATE INDEX IF NOT EXISTS idx_nav_links_location_order
  ON nav_links(location, sort_order) WHERE is_visible;

-- ── Homepage furniture ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stable identifier the page looks up by, so reordering or renaming a heading
  -- never changes which block of content it labels.
  section_key  VARCHAR(64) NOT NULL UNIQUE,
  kind         VARCHAR(16) NOT NULL CHECK (kind IN ('header', 'promo')),
  heading      TEXT NOT NULL,
  -- Promo cards only: the strapline under the label, and the pastel fill.
  description  TEXT,
  href         TEXT,
  -- Icon NAME, not markup. Components cannot be stored, so the page keeps a
  -- lookup from this string to a lucide icon and falls back when it misses.
  icon         VARCHAR(64),
  accent       VARCHAR(64),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_visible   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_sections_kind_order
  ON home_sections(kind, sort_order) WHERE is_visible;

-- ── RLS: same shape as list_items / spotlight_works ───────────────────────
ALTER TABLE nav_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read nav_links" ON nav_links FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated manage nav_links" ON nav_links
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read home_sections" ON home_sections FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated manage home_sections" ON home_sections
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TRIGGER update_nav_links_modtime BEFORE UPDATE ON nav_links
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_home_sections_modtime BEFORE UPDATE ON home_sections
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ── Seed: exactly what the components hardcode today ──────────────────────
INSERT INTO nav_links (location, label, href, sort_order) VALUES
  ('header',         'Reviews',        '/reviews',   1),
  ('header',         'News',           '/news',      2),
  ('header',         'Spotlight',      '/spotlight', 3),
  ('header',         'Rankings',       '/lists',     4),
  ('footer_explore', 'Reviews',        '/reviews',   1),
  ('footer_explore', 'News',           '/news',      2),
  ('footer_explore', 'Spotlight',      '/spotlight', 3),
  ('footer_explore', 'Rankings',       '/lists',     4),
  ('footer_company', 'About',          '/about',     1),
  ('footer_company', 'Contact',        '/contact',   2),
  ('footer_company', 'Privacy Policy', '/privacy',   3),
  ('footer_company', 'Terms',          '/terms',     4)
ON CONFLICT (location, href) DO NOTHING;

INSERT INTO home_sections (section_key, kind, heading, description, href, icon, accent, sort_order) VALUES
  ('most_talked',   'header', 'Most Talked This Week', NULL, NULL,         NULL,        NULL,           1),
  ('latest',        'header', 'The Latest',            NULL, NULL,         NULL,        NULL,           2),
  ('trending',      'header', 'Trending',              NULL, NULL,         NULL,        NULL,           3),
  ('on_our_radar',  'header', 'On Our Radar',          NULL, '/reviews',   NULL,        NULL,           4),
  ('editors_picks', 'header', 'Editor''s Picks',       NULL, NULL,         NULL,        NULL,           5),
  ('promo_reviews',   'promo', 'Reviews',   'Critical Takes', '/reviews',   'Star',      'bg-primary',   1),
  ('promo_news',      'promo', 'News',      'Latest Stories', '/news',      'Newspaper', 'bg-secondary', 2),
  ('promo_spotlight', 'promo', 'Spotlight', 'Deep Dives',     '/spotlight', 'Sparkles',  'bg-accent',    3),
  ('promo_lists',     'promo', 'Rankings',  'Best Of Lists',  '/lists',     'Trophy',    'bg-muted',     4)
ON CONFLICT (section_key) DO NOTHING;

-- ── Site chrome values the Footer hardcodes ───────────────────────────────
-- site_settings already exists as key/value JSONB with a working getSiteSettings(),
-- read today by exactly one place: the dashboard settings form. The public site
-- ignores it and hardcodes the same strings.
INSERT INTO site_settings (key, value, description) VALUES
  ('site_name', '"The Orange Pulp"'::jsonb, 'Wordmark and copyright name.'),
  ('copyright_notice', '"All rights reserved."'::jsonb, 'Trailing clause after the year and site name in the footer.')
ON CONFLICT (key) DO NOTHING;
