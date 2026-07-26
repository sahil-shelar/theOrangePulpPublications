// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { handleSupabaseError } from '@/utils/supabase-error'
import { ArticleWithRelations } from '@/types/models'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Deduplicates within a single render (generateMetadata + page both call this — only 1 DB hit)
export const getCachedArticleBySlug = cache(
  async (slug: string): Promise<ArticleWithRelations | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(*)')
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
      .select('*, categories(*), authors(*), movies(*)')
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

export async function searchArticles(query: string, limit = 10): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()
  
  // Try Full Text Search if column exists, else fallback to ilike
  const { data, error } = await supabase
    .from('articles')
    .select(`*, categories ( name, slug ), authors ( name, slug )`)
    .eq('status', 'published')
    .textSearch('title', query, { type: 'websearch' })
    .order('published_at', { ascending: false })
    .limit(20)
    
  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('articles')
      .select(`*, categories ( name, slug ), authors ( name, slug )`)
      .eq('status', 'published')
      .ilike('title', `%${query}%`)
      .order('published_at', { ascending: false })
      .limit(20)
    if (fallbackError) return []
    return fallback
  }
  return data
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
    .select('*, categories(*), authors(*), movies(*)')
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


