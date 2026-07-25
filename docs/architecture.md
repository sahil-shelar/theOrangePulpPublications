# Orange Pulp - Architecture Summary

## Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS (Brutalist Aesthetic)
- **Deployment**: Vercel
- **Language**: TypeScript

## Core Patterns
1. **Repository Layer**: Database interactions are abstracted in `/src/lib/api`. Components never query the database directly.
2. **Server Actions**: All mutations (`createArticle`, `updateArticle`, `deleteArticle`) are securely routed through Server Actions in `/src/lib/actions`.
3. **Server Components**: The default rendering method. Client components (`'use client'`) are strictly limited to interactive leaves (e.g., `<ArticleEditor />`, `<CommandPalette />`).
4. **Brutalism**: The design system relies on raw borders (`border-[3px] border-foreground`), high contrast, and uppercase typography (`font-heading`).

## Schema Modules
- `articles`, `movies`, `categories`, `tags`
- `ad_slots`, `affiliate_links`, `newsletter_campaigns`
- `ai_suggestions`, `movie_coverage_plans`, `seo_audits`, `trend_opportunities`

## Security (RLS)
- Supabase Row Level Security (RLS) is strictly enforced on all tables.
- Public read access for published articles.
- Authenticated admin access for CRUD operations.
