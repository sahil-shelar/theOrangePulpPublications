// @ts-nocheck
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import MovieDetail from '@/components/movies/MovieDetail'

const getMovieBySlug = cache(async (slug: string) => {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('movies')
    .select('*, articles(id, title, slug, type, status)')
    .eq('slug', slug)
    .single()
  return data ?? null
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const movie = await getMovieBySlug(slug)
  if (!movie) return {}
  return { title: `${movie.title} | The Orange Pulp` }
}

export default async function PublicMoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const movie = await getMovieBySlug(slug)
  if (!movie) notFound()

  const metadata = movie.metadata || {}
  const relatedArticles = (movie.articles ?? []).filter((a: any) => a.status === 'published')

  return (
    <MovieDetail
      title={movie.title}
      tagline={metadata.tagline}
      synopsis={movie.synopsis}
      poster_url={movie.poster_url}
      backdrop_url={movie.backdrop_url}
      release_date={movie.release_date}
      runtime={movie.runtime}
      director={movie.director}
      certification={metadata.certification}
      trailer_url={movie.trailer_url}
      genres={metadata.genres ?? []}
      cast={metadata.cast ?? []}
      budget={metadata.budget}
      revenue={metadata.revenue}
      streaming_providers={metadata.streaming_providers ?? []}
      relatedArticles={relatedArticles}
    />
  )
}
