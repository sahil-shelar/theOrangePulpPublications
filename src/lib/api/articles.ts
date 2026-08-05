// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { handleSupabaseError } from '@/utils/supabase-error'
import { ArticleWithRelations } from '@/types/models'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

const ARTICLE_DETAIL_SELECT =
  '*, categories(*), authors(*), movies(*), list_items(*, movies(*)), spotlight_works(*, movies(*))'

// Deduplicates within a single render (generateMetadata + page both call this — only 1 DB hit)
export const getCachedArticleBySlug = cache(
  async (slug: string): Promise<ArticleWithRelations | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_DETAIL_SELECT)
      .order('rank', { referencedTable: 'list_items', ascending: true })
      .order('rank', { referencedTable: 'spotlight_works', ascending: true })
      .eq('slug', slug)
      .single()
    if (error && error.code !== 'PGRST116') return null
    return data as ArticleWithRelations | null
  }
)

// Cross-request cache (60s) using public client — no cookies needed, safe for force-dynamic pages
export const getCachedPublicArticleBySlug = unstable_cache(
  async (slug: string): Promise<ArticleWithRelations | null> => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select(ARTICLE_DETAIL_SELECT)
      .order('rank', { referencedTable: 'list_items', ascending: true })
      .order('rank', { referencedTable: 'spotlight_works', ascending: true })
      .eq('slug', slug)
      .single()
    return (data ?? null) as ArticleWithRelations | null
  },
  ['public-article-by-slug'],
  { revalidate: 60, tags: ['articles'] }
)

// Returns published slugs by type — used in generateStaticParams
export const getPublishedSlugs = unstable_cache(
  async (type: string): Promise<{ slug: string }[]> => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select('slug')
      .eq('status', 'published')
      .eq('type', type)
    return data ?? []
  },
  ['published-slugs'],
  { revalidate: 300 }
)

// Cached listing functions — don't hit Supabase on every ISR revalidation
export const getCachedLatestArticles = unstable_cache(
  async (limit = 10) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['latest-articles'],
  { revalidate: 60, tags: ['articles'] }
)

export const getCachedReviews = unstable_cache(
  async (limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(*)')
      .eq('status', 'published')
      .eq('type', 'review')
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['reviews'],
  { revalidate: 60, tags: ['articles'] }
)

export const getCachedNews = unstable_cache(
  async (limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
      .eq('status', 'published')
      .eq('type', 'news')
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['news'],
  { revalidate: 60, tags: ['articles'] }
)

export const getCachedSpotlight = unstable_cache(
  async (limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
      .eq('status', 'published')
      .eq('type', 'spotlight')
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['spotlight'],
  { revalidate: 60, tags: ['articles'] }
)

export const getCachedLists = unstable_cache(
  async (limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
      .eq('status', 'published')
      .eq('type', 'list')
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['lists'],
  { revalidate: 60, tags: ['articles'] }
)

export const PAGE_SIZE = 18

// Paginated listing by type. Returns the slice plus the total count so the
// listing pages can render page controls — previously every listing was hard
// capped at 20 with no way to reach anything older.
export const getPagedArticlesByType = unstable_cache(
  async (type: string, page = 1, pageSize = PAGE_SIZE) => {
    const supabase = createPublicClient()
    const safePage = Math.max(1, Math.floor(page) || 1)
    const from = (safePage - 1) * pageSize

    const { data, count } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(*)', { count: 'exact' })
      .eq('status', 'published')
      .eq('type', type)
      .order('published_at', { ascending: false })
      .range(from, from + pageSize - 1)

    const total = count ?? 0
    return {
      articles: (data ?? []) as ArticleWithRelations[],
      total,
      page: safePage,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    }
  },
  ['paged-articles-by-type'],
  { revalidate: 60, tags: ['articles'] }
)

export async function getLatestArticles(limit = 10): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    handleSupabaseError(error)
    return []
  }
  return data as ArticleWithRelations[]
}

export const getArticlesByCategory = unstable_cache(
  async (categoryId: string, limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select(`*, categories(name,slug), authors(name,slug), movies(poster_url,backdrop_url)`)
      .eq('status', 'published')
      .eq('category_id', categoryId)
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['articles-by-category'],
  { revalidate: 60, tags: ['articles'] }
)

export const getArticlesByAuthor = unstable_cache(
  async (authorId: string, limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select(`*, categories(name,slug), authors(name,slug), movies(poster_url,backdrop_url)`)
      .eq('status', 'published')
      .eq('author_id', authorId)
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['articles-by-author'],
  { revalidate: 60, tags: ['articles'] }
)

export const getArticlesByTag = unstable_cache(
  async (tagId: string, limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('article_tags')
      .select(`article_id, articles(*, categories(name,slug), authors(name,slug), movies(poster_url,backdrop_url))`)
      .eq('tag_id', tagId)
      .limit(limit)
    return (data ?? [])
      .map((t: any) => t.articles)
      .filter((a: any) => a && a.status === 'published') as ArticleWithRelations[]
  },
  ['articles-by-tag'],
  { revalidate: 60, tags: ['articles'] }
)

// Builds a prefix-matching tsquery so as-you-type search finds partial words:
// "denis vil" -> "denis & vil:*". Strips every tsquery operator, since any
// stray & | ! ( ) : * from user input is a syntax error in to_tsquery.
function toPrefixTsQuery(raw: string): string {
  const terms = raw
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return ''
  return terms.map((t, i) => (i === terms.length - 1 ? `${t}:*` : t)).join(' & ')
}

const SEARCH_COLUMNS =
  'id, title, slug, type, excerpt, cover_image_url, rating, published_at, ' +
  'categories(name, slug), authors(name, slug), movies(poster_url)'

export async function searchArticles(query: string, limit = 10): Promise<ArticleWithRelations[]> {
  const tsQuery = toPrefixTsQuery(query)
  if (!tsQuery) return []

  const supabase = await createClient()

  // Two indexed passes, because neither alone is sufficient for as-you-type:
  //
  //  1. Full-text over title/excerpt/subheadline/content (GIN on search_vector).
  //     Broad coverage and word-aware, but English stemming mangles partial
  //     words — "odys" stems to "odi" (plural strip, then the y->i rule), so
  //     it will not prefix-match "odyssey".
  //  2. Substring match on title (GIN trigram). Catches the partials that
  //     stemming loses, and matches mid-word too.
  const [fts, substr] = await Promise.all([
    supabase
      .from('articles')
      .select(SEARCH_COLUMNS)
      .eq('status', 'published')
      .textSearch('search_vector', tsQuery)
      .order('published_at', { ascending: false })
      .limit(limit),
    supabase
      .from('articles')
      .select(SEARCH_COLUMNS)
      .eq('status', 'published')
      .ilike('title', `%${query.trim()}%`)
      .order('published_at', { ascending: false })
      .limit(limit),
  ])

  if (fts.error && substr.error) {
    handleSupabaseError(fts.error)
    return []
  }

  // Full-text hits rank first — they matched on indexed content, not just a
  // title substring.
  const seen = new Set<string>()
  const merged: ArticleWithRelations[] = []
  for (const row of [...(fts.data ?? []), ...(substr.data ?? [])] as ArticleWithRelations[]) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    merged.push(row)
  }
  return merged.slice(0, limit)
}

export async function getFeaturedArticle(): Promise<ArticleWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is the code for 'no rows returned'
    handleSupabaseError(error)
    return null
  }
  return data as ArticleWithRelations | null
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(*)')
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') {
    handleSupabaseError(error)
    return null
  }
  return data as ArticleWithRelations | null
}

export async function getArticleById(id: string): Promise<ArticleWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_DETAIL_SELECT)
    .order('rank', { referencedTable: 'list_items', ascending: true })
    .order('rank', { referencedTable: 'spotlight_works', ascending: true })
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    handleSupabaseError(error)
    return null
  }
  return data as ArticleWithRelations | null
}

export async function getReviews(limit = 10): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(*)')
    .eq('status', 'published')
    .eq('type', 'review')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    handleSupabaseError(error)
    return []
  }
  return data as ArticleWithRelations[]
}

export async function getNews(limit = 10): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .eq('type', 'news')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    handleSupabaseError(error)
    return []
  }
  return data as ArticleWithRelations[]
}

export async function getSpotlight(limit = 10): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .eq('type', 'spotlight')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    handleSupabaseError(error)
    return []
  }
  return data as ArticleWithRelations[]
}

export async function getLists(limit = 10): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .eq('type', 'list')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    handleSupabaseError(error)
    return []
  }
  return data as ArticleWithRelations[]
}

export async function getRelatedArticles(articleId: string, categoryId?: string, limit = 3): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()
  let query = supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(limit)
    
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    handleSupabaseError(error)
    return []
  }
  return data as ArticleWithRelations[]
}


