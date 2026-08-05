import { createPublicClient } from '@/lib/supabase/public'
import { ArticleWithRelations } from '@/types/models'

// Only the columns the recommendation sidebar renders plus the ones scored
// below. Notably excludes `content` — selecting * pulled 40 full markdown
// article bodies over the wire to produce a 4-item list.
// Must stay a single literal — supabase-js parses the select string at the type
// level, and string concatenation makes it infer GenericStringError instead.
const CANDIDATE_COLUMNS =
  'id, title, slug, type, cover_image_url, category_id, movie_id, published_at, views_count, categories(name, slug), authors(name, slug), movies(poster_url, backdrop_url)'

export async function getRecommendedArticles(
  sourceArticleId: string,
  limit = 5,
  hint?: { category_id?: string | null; type?: string; movie_id?: string | null }
) {
  const supabase = createPublicClient()

  const { data: candidates, error } = await supabase
    .from('articles')
    .select(CANDIDATE_COLUMNS)
    .eq('status', 'published')
    .neq('id', sourceArticleId)
    .limit(40)

  if (error || !candidates) return []

  const scored = candidates.map(candidate => {
    let score = 0
    if (hint?.category_id && candidate.category_id === hint.category_id) score += 30
    if (hint?.type && candidate.type === hint.type) score += 10
    if (hint?.movie_id && candidate.movie_id === hint.movie_id) score += 50
    const publishedAt = candidate.published_at ? new Date(candidate.published_at).getTime() : NaN
    const ageDays = Number.isNaN(publishedAt) ? Infinity : (Date.now() - publishedAt) / 86_400_000
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

  const { data: source } = await supabase
    .from('movies')
    .select('id, director, release_year')
    .eq('id', sourceMovieId)
    .single()
  if (!source) return []

  // Excludes synopsis/cast_list/crew_list/metadata — none are used for scoring
  // or in the rendered card.
  const { data: candidates } = await supabase
    .from('movies')
    .select('id, title, slug, poster_url, release_year, director')
    .neq('id', sourceMovieId)
    .limit(50)
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
