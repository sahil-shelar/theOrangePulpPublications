import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { ArticleWithRelations } from '@/types/models'

export async function getDashboardStats() {
  const supabase = await createClient()

  const [
    { count: totalArticles },
    { count: publishedArticles },
    { count: drafts },
    { count: categories },
    { count: movies },
    { count: subscribers },
    { data: latestArticles },
    { data: recentDrafts },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('movies').select('*', { count: 'exact', head: true }),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*, categories(*), authors(*)').order('created_at', { ascending: false }).limit(5),
    supabase.from('articles').select('*, categories(*), authors(*)').eq('status', 'draft').order('updated_at', { ascending: false }).limit(5),
  ])

  return {
    totalArticles:     totalArticles     || 0,
    publishedArticles: publishedArticles || 0,
    drafts:            drafts            || 0,
    categories:        categories        || 0,
    movies:            movies            || 0,
    subscribers:       subscribers       || 0,
    latestArticles:  (latestArticles  || []) as ArticleWithRelations[],
    recentDrafts:    (recentDrafts    || []) as ArticleWithRelations[],
  }
}

// Cached taxonomy — safe to share across requests (public data, changes infrequently)
export const getCachedCategories = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    return data ?? []
  },
  ['dashboard-categories'],
  { revalidate: 60, tags: ['categories'] }
)

export const getCachedAuthors = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('authors').select('*').order('name')
    return data ?? []
  },
  ['dashboard-authors'],
  { revalidate: 60, tags: ['authors'] }
)

export const getCachedMoviePickers = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('movies')
      .select('id, title, slug, poster_url, release_year')
      .order('title')
    return data ?? []
  },
  ['dashboard-movies-picker'],
  { revalidate: 120, tags: ['movies'] }
)

export const getCachedTags = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('tags').select('*').order('name')
    return data ?? []
  },
  ['dashboard-tags'],
  { revalidate: 60, tags: ['tags'] }
)
