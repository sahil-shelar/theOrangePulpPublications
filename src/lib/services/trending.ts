import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { ArticleWithRelations } from '@/types/models'

// unstable_cache key includes args so each (limit, type) combo gets its own cache entry
const _getTrendingContent = unstable_cache(
  async (limit: number, type: string) => {
    const supabase = createPublicClient()
    let query = supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
      .eq('status', 'published')
      .order('views_count', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit)
    if (type !== 'all') query = query.eq('type', type as any)
    const { data } = await query
    return (data ?? []) as ArticleWithRelations[]
  },
  ['trending-content'],
  { revalidate: 300, tags: ['articles'] }
)
export function getTrendingContent(limit = 10, type?: 'review' | 'news' | 'list' | 'spotlight') {
  return _getTrendingContent(limit, type ?? 'all')
}

export const getTrendingMovies = unstable_cache(
  async (limit = 10) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('movies')
      .select('*')
      .order('release_year', { ascending: false })
      .limit(limit)
    return data ?? []
  },
  ['trending-movies'],
  { revalidate: 300, tags: ['movies'] }
)

export const getEditorsPicks = unstable_cache(
  async (limit = 6) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('articles')
      .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as ArticleWithRelations[]
  },
  ['editors-picks'],
  { revalidate: 300, tags: ['articles'] }
)

export async function getHiddenGems(limit = 4) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .eq('type', 'spotlight')
    .order('views_count', { ascending: true })
    .limit(limit)
  return (data ?? []) as ArticleWithRelations[]
}
