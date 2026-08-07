// @ts-nocheck
import { notFound } from 'next/navigation'
import { getTmdbMovieDetails, parseTmdbToInternalMovie } from '@/lib/services/tmdb'
import { createPublicClient } from '@/lib/supabase/public'
import MovieDetail from '@/components/movies/MovieDetail'
import { visibleDataOrigins } from '@/lib/data-origin'

export const revalidate = 3600

async function getRelatedArticles(tmdbId: number) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('movies')
    .select('articles(id, title, slug, type, status, origin)')
    .eq('tmdb_id', tmdbId)
    .single()
  // Same JS-side filter as the slug route: the query selects from `movies`.
  const visible = visibleDataOrigins()
  return (data?.articles as any[])?.filter((a: any) => a.status === 'published' && visible.includes(a.origin)) ?? []
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = await getTmdbMovieDetails(id)
  if (!raw || raw.success === false) return {}
  return { title: `${raw.title} | The Orange Pulp` }
}

export default async function TmdbMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = await getTmdbMovieDetails(id)
  if (!raw || raw.success === false) notFound()

  const movie = parseTmdbToInternalMovie(raw)
  if (!movie) notFound()

  const relatedArticles = await getRelatedArticles(Number(id))

  return (
    <MovieDetail
      title={movie.title}
      tagline={raw.tagline}
      synopsis={movie.synopsis}
      poster_url={movie.poster_url}
      backdrop_url={movie.backdrop_url}
      release_date={movie.release_date}
      runtime={movie.runtime}
      director={movie.director}
      certification={movie.certification}
      trailer_url={movie.trailer_url}
      genres={movie.metadata.genres}
      cast={movie.metadata.cast}
      budget={movie.metadata.budget}
      revenue={movie.metadata.revenue}
      streaming_providers={movie.metadata.streaming_providers}
      relatedArticles={relatedArticles}
    />
  )
}
