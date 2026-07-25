# The Orange Pulp — Developer Documentation

## Architecture

The Orange Pulp is a modern Next.js 15 web application utilizing React Server Components and Turbopack. It is backed by Supabase (PostgreSQL, Auth, Storage) and features a brutalist design system built with Tailwind CSS.

### Core Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase / PostgreSQL
- **Styling**: Tailwind CSS (Brutalist aesthetic)
- **Icons**: Lucide React
- **Markdown**: react-markdown

## Folder Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/health        # Health check endpoint
│   ├── dashboard/        # CMS Admin interfaces
│   └── (public pages)    # Homepage, articles, movies, authors
├── components/           # Reusable UI components
│   ├── ads/              # Advertisement slots
│   ├── article/          # Article presentation components
│   ├── dashboard/        # Admin CMS components (editors, managers)
│   └── layout/           # Navbar, Footer, etc.
├── lib/                  # Core logic and services
│   ├── api/              # Repository layer for data fetching
│   ├── actions/          # Next.js Server Actions for mutations
│   ├── services/         # Complex services (jobs, trending, recommendations)
│   └── supabase/         # Supabase client configurations
├── types/                # TypeScript definitions and database models
└── utils/                # Helper utilities (error handling, formatting)
supabase/
└── migrations/           # PostgreSQL schema and RLS policies
```

## Repository Layer (`src/lib/api`)

All database queries must go through the repository layer. Direct Supabase queries inside React components are prohibited.

- **`articles.ts`**: Fetching articles, reviews, news.
- **`movies.ts`**: Movie database interactions.
- **`taxonomy.ts`**: Categories and tags.
- **`authors.ts`**: Author profiles.

## Server Actions (`src/lib/actions`)

All data mutations (Create, Update, Delete) are handled by Next.js Server Actions. They run securely on the server and use `revalidatePath` to update the UI instantly.

Example: `src/lib/actions/articles.ts`

## Jobs Engine (`src/lib/services/jobs.ts`)

A generic background jobs system is implemented in the database via the `jobs` table.
- **Job Types**: `tmdb_sync`, `image_optimize`, `audit_log`, `rebuild_cache`.
- **Statuses**: `Pending`, `Running`, `Completed`, `Failed`.

## Security & Database

Row Level Security (RLS) is strictly enforced on all tables.
- Public tables (Articles, Movies) are readable by everyone but writable only by `authenticated` users.
- Sensitive tables (Jobs, Newsletter) are entirely restricted to authenticated users.

## Caching Strategy & Performance

- **Static Generation (SSG)**: Most public pages are statically generated at build time.
- **ISR**: We use `export const revalidate = 3600` on key pages to update them in the background without blocking users.
- **Suspense & Streaming**: Implemented across complex components.
- **Date Hydration**: Ensure `toLocaleDateString('en-US', { timeZone: 'UTC' })` is used on dates rendered on both server and client to avoid hydration mismatch.

## Deployment

The application is deployed on Vercel. 

### Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Internal API keys
TMDB_API_KEY=optional_tmdb_key
```

### Pre-Flight Checks
1. Run `npm run lint` and `npm run type-check`.
2. Push all database migrations: `npx supabase db push`.
3. Verify `/api/health` returns `200 OK`.
