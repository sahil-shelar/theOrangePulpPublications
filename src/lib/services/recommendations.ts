// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/public'
import { ArticleWithRelations } from '@/types/models'

export async function getRecommendedArticles(
  sourceArticleId: string,
  limit = 5,
  hint?: { category_id?: string | null; type?: string; movie_id?: string | null }
) {
  const supabase = createPublicClient()

  const { data: candidates, error } = await supabase
    .from('articles')
    .select('*, categories(*), authors(*), movies(poster_url, backdrop_url)')
    .eq('status', 'published')
    .neq('id', sourceArticleId)
    .limit(40)

  if (error || !candidates) return []

  const scored = candidates.map(candidate => {
    let score = 0
    if (hint?.category_id && candidate.category_id === hint.category_id) score += 30
    if (hint?.type && candidate.type === hint.type) score += 10
    if (hint?.movie_id && candidate.movie_id === hint.movie_id) score += 50
    const ageDays = (Date.now() - new Date(candidate.published_at).getTime()) / 86_400_000
    if (ageDays < 7) score += 20
    else if (ageDays < 30) score += 10
    if (candidate.views_count > 1000) score += 15
    else if (candidate.views_count > 100) score += 5
    return { article: candidate, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(c => c.article) as ArticleWithRelations[]
}

export async function getRelatedMovies(sourceMovieId: string, limit = 5) {
  const supabase = createPublicClient()

  const { data: source } = await supabase.from('movies').select('*').eq('id', sourceMovieId).single()
  if (!source) return []

  const { data: candidates } = await supabase.from('movies').select('*').neq('id', sourceMovieId).limit(50)
  if (!candidates) return []

  const scored = candidates.map(candidate => {
    let score = 0
    if (candidate.director && candidate.director === source.director) score += 40
    const sourceYear = source.release_year
    const candYear = candidate.release_year
    if (sourceYear && candYear && Math.abs(sourceYear - candYear) <= 2) score += 20
    return { movie: candidate, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(c => c.movie)
}
