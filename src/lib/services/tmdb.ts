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

/**
 * Fetch + parse, retrying transient failures, and THROWING when it ultimately
 * fails.
 *
 * Callers that select which films appear in an article must use this rather than
 * catching and returning `[]`. A swallowed ECONNRESET became the user-facing
 * message "only 0 qualifying titles for Denis Villeneuve" — an infrastructure
 * failure dressed up as an editorial fact about his filmography. Observed
 * against a live TMDB throttle.
 *
 * Public listing pages (trending, now playing) still degrade gracefully; an empty
 * carousel there is better than a broken page.
 */
async function tmdbFetchJson(path: string, revalidate = 3600, attempts = 5): Promise<any> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      // Only the first attempt participates in the Next fetch cache. Retries must
      // set `cache: 'no-store'`, because Next memoizes an identical cached fetch
      // for the render — including its rejection — so a retry with the same
      // options replays the same failure instead of hitting the network. Observed:
      // 3/3 attempts failing in-route while a fresh process succeeded on attempt 2.
      const res = await fetch(
        `${TMDB_BASE_URL}${path}`,
        attempt === 0
          ? { headers: getHeaders(), next: { revalidate } }
          : { headers: getHeaders(), cache: 'no-store' }
      )
      if (!res.ok) throw new Error(`TMDB ${res.status} ${res.statusText} for ${path.split('?')[0]}`)
      return await res.json()
    } catch (e) {
      lastError = e
      // Backoff is capped so the whole run stays inside the 60s serverless
      // budget: 300/700/1500/3000ms is ~5.5s worst case, up from ~3.5s.
      //
      // Widened because the failures are not throttling. Measured against a
      // live TMDB endpoint, roughly half of sequential single requests failed
      // at TLS connect (curl rc=35) in well under a second -- no payload, no
      // 429, no concurrency involved. Losses that arrive in bursts can take
      // every attempt inside a narrow window, so the window matters more than
      // the attempt count.
      //
      // Jitter so the concurrent detail fetches in the generation pipeline do
      // not retry in lockstep and rebuild the burst they are recovering from.
      if (attempt < attempts - 1) {
        const backoff = Math.min(300 * 2 ** attempt, 3000) + Math.random() * 250
        await new Promise(r => setTimeout(r, backoff))
      }
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError)
  const cause = (lastError as any)?.cause?.code ? ` [${(lastError as any).cause.code}]` : ''
  // Full path, not just the endpoint: a query that fails reproducibly is almost
  // always a malformed parameter, and the endpoint alone does not show that.
  throw new Error(`TMDB request failed after ${attempts} attempts (${path}): ${detail}${cause}`)
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

/**
 * Full movie record. Retries and then throws.
 *
 * This used to swallow failures and return null. In the ranking generator that
 * meant a transient ECONNRESET produced a `list_items` row with `movie_id: null`
 * — a card with no poster and no link — while the run still reported success.
 * Failing loudly is better: the run is cheap to repeat.
 */
export async function getTmdbMovieDetails(tmdbId: number | string) {
  return tmdbFetchJson(
    `/movie/${tmdbId}?append_to_response=credits,videos,release_dates,watch/providers,images&include_image_language=null,en`
  )
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
/** TMDB genre 10770 is "TV Movie" — broadcast specials, not cinema releases. */
const EXCLUDE_TV_MOVIE_GENRE = 10770

/** Drops shorts and music videos. This is what removes "Michael Jackson's
 *  Thriller" (14 min) and Doctor Who specials from a movie ranking. */
const MIN_FEATURE_RUNTIME = 60

export async function discoverTmdbMovies(params: Record<string, string | number>) {
  const query = new URLSearchParams({
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    // Applied centrally, not per caller. These two guards lived only in
    // intent.ts's free-text path, so the fixed templates — the ones the weekly
    // cron actually runs — could surface TV movies and 14-minute shorts in a
    // ranking of films. Callers can still override by passing the same keys.
    without_genres: String(EXCLUDE_TV_MOVIE_GENRE),
    'with_runtime.gte': String(MIN_FEATURE_RUNTIME),
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  })

  // Deliberately not caught: an empty list here would be read downstream as
  // "no films match that query" rather than "the request failed".
  const data = await tmdbFetchJson(`/discover/movie?${query}`)
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
}

/** Genre name -> TMDB genre id, for templates parameterised by genre. */
export async function getTmdbGenreMap(): Promise<Record<string, number>> {
  const data = await tmdbFetchJson('/genre/movie/list?language=en', 86400)
  const map: Record<string, number> = {}
  for (const g of data.genres || []) map[g.name.toLowerCase()] = g.id
  return map
}

/**
 * Streaming provider name -> TMDB provider id, for region-scoped availability
 * queries ("netflix and chill" is a real query: with_watch_providers=8).
 */
export async function getTmdbWatchProviders(region = 'US'): Promise<Record<string, number>> {
  const data = await tmdbFetchJson(`/watch/providers/movie?language=en-US&watch_region=${region}`, 86400)
  const map: Record<string, number> = {}
  for (const p of data.results || []) map[p.provider_name.toLowerCase()] = p.provider_id
  return map
}

/** Strip case, accents and punctuation so "Iñárritu" matches "Inarritu". */
function normaliseName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Rank a /search/person hit against what was actually typed.
 *
 * TMDB's result order is NOT usable as-is, and not popularity-ordered either.
 * Measured 2026-08-08: `?query=Anderson` returns "Dion Anderson" (Acting,
 * popularity 1) ahead of "Gillian Anderson" (Acting, popularity 5). Taking
 * results[0] meant "top films by Anderson" resolved to a bit-part actor, which
 * surfaces either as a confidently wrong article headlined "The 10 Best Films
 * Directed by Dion Anderson" or as "TMDB returned only 0 qualifying titles" —
 * an infrastructure accident dressed up as a fact about a filmography, which is
 * the exact failure tmdbFetchJson was rewritten to stop producing.
 *
 * Name match dominates, because the editor typed a name and meant it. Department
 * is the tiebreaker that separates the several same-named people TMDB holds, and
 * popularity only breaks ties below that.
 */
function scorePerson(person: any, query: string, preferDepartment: string | null): number {
  const wanted = normaliseName(query)
  const name = normaliseName(person.name ?? '')
  const wantedWords = wanted.split(' ').filter(Boolean)
  const nameWords = name.split(' ').filter(Boolean)

  // A one-word query is a surname or a mononym, and is therefore ambiguous by
  // construction: "Nolan" describes Christopher Nolan just as truthfully as it
  // describes a bit-part actor whose entire credited name is "Nolan". Letting an
  // exact string match dominate there picked the actor (measured 2026-08-08), so
  // single-token queries score name matches nearly flat and let department and
  // popularity decide. A multi-word query is specific — somebody typed a full
  // name — so there an exact match should win outright.
  const specific = wantedWords.length > 1

  let score = 0
  if (name === wanted) score += specific ? 1000 : 300
  else if (wantedWords.every(w => nameWords.includes(w))) score += specific ? 600 : 250
  else if (wantedWords.every(w => name.includes(w))) score += specific ? 300 : 150

  if (preferDepartment && person.known_for_department === preferDepartment) score += 300

  // Bounded, so a very popular actor cannot outrank a correctly-named director,
  // but present, because it is the only signal separating same-named people who
  // share a department.
  score += Math.min(Number(person.popularity) || 0, 100)

  return score
}

/**
 * Best-match person, for the "top films by {director}" template and the
 * free-text parser's director branch.
 *
 * Both callers want a DIRECTOR, so Directing is preferred by default — a
 * same-named actor should not win a query that will be headlined "directed by".
 * Pass `preferDepartment: null` for a neutral search.
 *
 * Returns null only when TMDB genuinely has no such person; a failed request
 * throws. `alternatives` carries the runners-up so a caller can say who else it
 * considered rather than silently committing to one interpretation.
 */
export async function searchTmdbPerson(
  query: string,
  opts: { preferDepartment?: string | null } = {}
) {
  const preferDepartment = opts.preferDepartment === undefined ? 'Directing' : opts.preferDepartment

  const data = await tmdbFetchJson(
    `/search/person?query=${encodeURIComponent(query)}&include_adult=false&language=en-US`,
    86400
  )

  const results = (data.results || []) as any[]
  if (results.length === 0) return null

  const ranked = results
    .map(person => ({ person, score: scorePerson(person, query, preferDepartment) }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0].person
  return {
    id: best.id as number,
    name: best.name as string,
    knownForDepartment: (best.known_for_department ?? null) as string | null,
    alternatives: ranked.slice(1, 4).map(r => ({
      id: r.person.id as number,
      name: r.person.name as string,
      knownForDepartment: (r.person.known_for_department ?? null) as string | null,
    })),
  }
}

/**
 * Structured person fields — NOT the biography.
 *
 * `biography` is deliberately absent from the return type. It is user-contributed
 * free text, so anything generated from it asserts unverifiable claims about a
 * real person; the spotlight pipeline renders the typed fields below as data
 * instead. Adding biography here would quietly make it available to a prompt.
 */
export async function getTmdbPersonDetails(personId: number) {
  const data = await tmdbFetchJson(`/person/${personId}?language=en-US`, 86400)
  if (!data?.id) return null
  return {
    id: data.id as number,
    name: data.name as string,
    profile_path: (data.profile_path ?? null) as string | null,
    known_for_department: (data.known_for_department ?? null) as string | null,
    // Frequently null on TMDB, including for working directors. Callers must
    // render without them rather than treating them as guaranteed.
    birthday: (data.birthday ?? null) as string | null,
    place_of_birth: (data.place_of_birth ?? null) as string | null,
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
  const data = await tmdbFetchJson(`/person/${personId}/movie_credits?language=en-US`, 86400)

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
