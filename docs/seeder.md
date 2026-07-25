# Orange Pulp Seeder — Full Documentation

## Overview

The Orange Pulp seeding system generates a complete, production-quality dataset that makes the platform look like an active entertainment publication with months of editorial history.

**Key Design Principles:**
- ✅ **Idempotent** — safe to run any number of times, never duplicates data
- ✅ **Relational** — all entities are properly interconnected
- ✅ **Realistic** — content, dates, and metrics mirror a real publication
- ✅ **Modular** — run individual seeders or all at once

---

## Quick Start

### 1. Set up environment

Add your Supabase **Service Role Key** to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   ← required for seeding
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...              ← used by the Next.js app
TMDB_API_KEY=your_tmdb_api_key                                        ← optional, for real movies
```

> ⚠️ The **Service Role Key** bypasses RLS and is required to insert seed data.
> Find it in your Supabase project: Settings → API → Service Role Key.
> **Never expose this key to the browser or commit it to Git.**

### 2. Run the full seeder

```bash
npm run seed -- --all
```

### 3. Or run individual seeders

```bash
npm run seed -- --categories --tags --authors
npm run seed -- --movies
npm run seed -- --articles
npm run seed -- --analytics --comments
```

---

## CLI Reference

```
npm run seed -- [options]

Options:
  --all          Run all seeders in the correct dependency order
  --categories   Seed 14 editorial categories
  --tags         Seed 150+ tags (directors, actors, genres, franchises)
  --authors      Seed 12 realistic editorial personas
  --movies       Import movies via TMDb API (or 20 placeholders if no API key)
  --articles     Seed reviews, news, spotlights, rankings, and editorial features
  --analytics    Seed page views, ad slots, and newsletter data
  --comments     Seed article comments
```

---

## Seeder Architecture

```
scripts/
  seed/
    index.ts        ← CLI entry point (orchestrates all seeders)
    utils.ts        ← Supabase client, helper functions
    categories.ts   ← 14 categories
    tags.ts         ← 150+ tags
    authors.ts      ← 12 editorial personas
    movies.ts       ← TMDb integration + placeholders
    articles.ts     ← Reviews, news, spotlights, rankings, features
    analytics.ts    ← Page views, ad slots, newsletter campaigns
    comments.ts     ← Article comments
```

### Dependency Order

```
categories → tags → authors → movies → articles → analytics → comments
```

Always run foundation seeders (categories, tags, authors, movies) before content seeders.

---

## Data Generated

### Categories (14)
Movie Reviews, TV Reviews, Anime, News, Box Office, Streaming, Trailers,
Features, Ending Explained, Rankings, Spotlights, Industry News, Awards, OTT

### Tags (150+)
- Studios: Marvel, DC, A24, Pixar, Blumhouse, Neon...
- Directors: Nolan, Villeneuve, Scorsese, Tarantino, Gerwig...
- Actors: Zendaya, Timothée Chalamet, Margot Robbie...
- Genres: Sci-Fi, Horror, Thriller, Animation, Documentary...
- Franchises: MCU, Star Wars, Mission Impossible, Dune...
- Topics: Ending Explained, Easter Eggs, Character Study...

### Authors (12)
Realistic editorial personas with bios, social links, and specializations

### Movies (20–500)
Without API key: 20 recent blockbusters (Oppenheimer, Barbie, Dune 2...)  
With TMDb key: 300–500 real movies from popular/top-rated/trending endpoints

### Articles (200+)
- **80 Reviews** — professional film reviews with rating, pros/cons, verdict
- **80 News articles** — entertainment news across 20 topics × 4 variations  
- **20 Spotlights** — ending explainers, hidden details, character analyses
- **10 Rankings** — definitive ranked lists
- **12 Editorial Features** — long-form industry analysis

### Analytics
- **Page views** — 50–500 views per article spread over 12 months
- **Ad slots** — 8 pre-configured slots with realistic impressions and CTR
- **Newsletter subscribers** — 30 sample subscribers
- **Newsletter campaigns** — 5 historical campaigns with open/click rates

---

## Idempotency

| Table | Unique Key | Strategy |
|-------|------------|----------|
| categories | slug | upsert on conflict |
| tags | slug | upsert on conflict |
| authors | name | upsert on conflict |
| movies | tmdb_id | upsert on conflict |
| articles | slug | upsert on conflict |
| article_tags | (article_id, tag_id) | ignoreDuplicates |
| newsletter_subscribers | email | ignoreDuplicates |
| ad_slots | slot_key | upsert on conflict |
| page_views | — | insert only if count < 1000 |
| comments | — | insert only if count < 100 |

---

## Adding New Seeders

1. Create `scripts/seed/my-entity.ts`
2. Export a function: `export async function seedMyEntity(): Promise<void>`
3. Import and call it in `scripts/seed/index.ts` under the appropriate flag
4. Use `supabase.from('table').upsert(data, { onConflict: 'unique_key' })`

### Template

```typescript
import { supabase, log, logError } from './utils'

export async function seedMyEntity(): Promise<void> {
  log('Seeding my-entity...')
  
  const data = [
    { name: 'Example', slug: 'example' },
  ]
  
  const { data: result, error } = await supabase
    .from('my_table')
    .upsert(data, { onConflict: 'slug', ignoreDuplicates: false })
    .select()
    
  if (error) {
    logError('seedMyEntity', error)
    return
  }
  
  log(`✓ Seeded ${result?.length ?? 0} entities`)
}
```

---

## Resetting Demo Data

To reset all seeded data and start fresh:

```sql
-- Run in Supabase SQL Editor
TRUNCATE article_tags, articles, movies, authors, categories, tags, 
         page_views, comments, ad_slots, newsletter_subscribers 
         RESTART IDENTITY CASCADE;
```

Or use the **Developer Dashboard** at `/dashboard/developer` → **Clear Demo Data**.

---

## Developer Dashboard

The `/dashboard/developer` page provides a UI for triggering seeder operations during development and staging.

> ℹ️ The dashboard triggers are designed for local/staging use. In production serverless environments (Vercel Edge), running the full seeder from the dashboard requires configuring it as a background function or Vercel Cron job due to execution time limits.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for seeding | Bypasses RLS for data insertion |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | App only | Used by the Next.js frontend |
| `TMDB_API_KEY` | ❌ optional | Required for 300–500 real movies |
