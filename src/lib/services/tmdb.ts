// API Wrapper for TMDb

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

function getHeaders() {
  const token = process.env.TMDB_BEARER_TOKEN
  if (!token) {
    console.warn("Missing TMDB_BEARER_TOKEN. TMDb sync might fail.")
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export async function searchTmdbMovie(query: string) {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false`, {
      headers: getHeaders()
    })
    const data = await res.json()
    return data.results || []
  } catch (e) {
    console.error("TMDb Search failed:", e)
    return []
  }
}

export async function getTmdbMovieDetails(tmdbId: number | string) {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?append_to_response=credits,videos,release_dates,watch/providers,images&include_image_language=null,en`, {
      headers: getHeaders()
    })
    const data = await res.json()
    return data
  } catch (e) {
    console.error("TMDb Details failed:", e)
    return null
  }
}

export async function getTmdbNowPlaying(page = 1) {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/now_playing?page=${page}&region=US`, {
      headers: getHeaders(),
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    return (data.results || []).map((m: any) => ({
      tmdb_id: m.id,
      title: m.title,
      poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
      release_date: m.release_date,
      rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
      overview: m.overview,
    }))
  } catch (e) {
    console.error('TMDB now_playing failed:', e)
    return []
  }
}

export async function getTmdbTrendingWeek() {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/week`, {
      headers: getHeaders(),
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    return (data.results || []).map((m: any) => ({
      tmdb_id: m.id,
      title: m.title,
      poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
      release_date: m.release_date,
      rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
      overview: m.overview,
    }))
  } catch (e) {
    console.error('TMDB trending failed:', e)
    return []
  }
}

export type TmdbDiscoverResult = {
  tmdb_id: number
  title: string
  release_date: string | null
  release_year: number | null
  vote_average: number | null
  vote_count: number
  overview: string
  poster_url: string | null
}

/**
 * Discover movies by structured criteria. Used by the generation templates,
 * each of which maps to a fixed query so the facts handed to the model are
 * fully determined by the query rather than by anything a model invented.
 *
 * `vote_count.gte` is not optional in spirit: without it `vote_average.desc`
 * surfaces obscure titles with a handful of votes sitting at 10.0, which are
 * both bad rankings and the titles a model is most likely to fabricate about.
 */
export async function discoverTmdbMovies(params: Record<string, string | number>) {
  const query = new URLSearchParams({
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  })

  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?${query}`, {
      headers: getHeaders(),
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    return ((data.results || []) as any[]).map((m): TmdbDiscoverResult => ({
      tmdb_id: m.id,
      title: m.title,
      release_date: m.release_date || null,
      release_year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
      vote_average: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
      vote_count: m.vote_count ?? 0,
      overview: m.overview || '',
      poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    }))
  } catch (e) {
    console.error('TMDB discover failed:', e)
    return []
  }
}

/** Genre name -> TMDB genre id, for templates parameterised by genre. */
export async function getTmdbGenreMap(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/genre/movie/list?language=en`, {
      headers: getHeaders(),
      next: { revalidate: 86400 },
    })
    const data = await res.json()
    const map: Record<string, number> = {}
    for (const g of data.genres || []) map[g.name.toLowerCase()] = g.id
    return map
  } catch (e) {
    console.error('TMDB genre list failed:', e)
    return {}
  }
}

/** Best-match person, for the "top films by {director}" template. */
export async function searchTmdbPerson(query: string) {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/person?query=${encodeURIComponent(query)}&include_adult=false&language=en-US`,
      { headers: getHeaders(), next: { revalidate: 86400 } }
    )
    const data = await res.json()
    const best = (data.results || [])[0]
    if (!best) return null
    return { id: best.id as number, name: best.name as string }
  } catch (e) {
    console.error('TMDB person search failed:', e)
    return null
  }
}

/**
 * Films a person actually DIRECTED, best-scored first.
 *
 * Not /discover&with_crew: that matches any crew role, so a prolific producer
 * (Spielberg) would return films they never directed under a headline claiming
 * they did. movie_credits carries the `job` field, which is the only way to
 * assert direction.
 */
export async function getTmdbPersonDirectedMovies(personId: number, minVotes = 150) {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/person/${personId}/movie_credits?language=en-US`, {
      headers: getHeaders(),
      next: { revalidate: 86400 },
    })
    const data = await res.json()

    const directed = ((data.crew || []) as any[]).filter(c => c.job === 'Director')

    // A person can hold several crew jobs on one film, so de-duplicate by id.
    const seen = new Set<number>()
    return directed
      .filter(m => {
        if (seen.has(m.id) || (m.vote_count ?? 0) < minVotes) return false
        seen.add(m.id)
        return true
      })
      .map((m): TmdbDiscoverResult => ({
        tmdb_id: m.id,
        title: m.title,
        release_date: m.release_date || null,
        release_year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
        vote_average: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
        vote_count: m.vote_count ?? 0,
        overview: m.overview || '',
        poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      }))
      .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0) || b.vote_count - a.vote_count)
  } catch (e) {
    console.error('TMDB person credits failed:', e)
    return []
  }
}

export function parseTmdbToInternalMovie(tmdbData: any) {
  if (!tmdbData || !tmdbData.id) return null

  // Extract core trailer
  const trailer = tmdbData.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
  
  // Extract US Certifications as fallback
  const releaseDates = tmdbData.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US')
  const certification = releaseDates?.release_dates?.[0]?.certification || 'NR'

  // Extract primary crew
  const director = tmdbData.credits?.crew?.find((c: any) => c.job === 'Director')?.name || ''
  
  // Create our normalized object format
  // Pick best backdrop: no text overlay (iso_639_1 null), highest vote_average, then widest
  const backdrops: any[] = tmdbData.images?.backdrops ?? []
  const bestBackdrop = backdrops
    .filter((b: any) => b.iso_639_1 === null || b.iso_639_1 === '')
    .sort((a: any, b: any) => b.vote_average - a.vote_average || b.width - a.width)[0]
  const backdropPath = bestBackdrop?.file_path ?? tmdbData.backdrop_path

  return {
    title: tmdbData.title,
    original_title: tmdbData.original_title,
    synopsis: tmdbData.overview,
    poster_url: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}` : null,
    backdrop_url: backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : null,
    runtime: tmdbData.runtime,
    release_date: tmdbData.release_date,
    director: director,
    trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    certification,
    tmdb_id: tmdbData.id,
    
    // Stored as JSONB in DB
    metadata: {
      budget: tmdbData.budget,
      revenue: tmdbData.revenue,
      genres: tmdbData.genres?.map((g: any) => g.name) || [],
      production_companies: tmdbData.production_companies?.map((c: any) => c.name) || [],
      cast: tmdbData.credits?.cast?.slice(0, 10).map((c: any) => ({ name: c.name, character: c.character, profile: c.profile_path })) || [],
      streaming_providers: tmdbData['watch/providers']?.results?.US?.flatrate?.map((p: any) => p.provider_name) || []
    }
  }
}
