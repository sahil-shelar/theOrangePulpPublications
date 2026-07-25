const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

function getHeaders() {
  const token = process.env.TMDB_BEARER_TOKEN
  if (!token) throw new Error("Missing TMDB_BEARER_TOKEN")
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export async function fetchTmdbList(type: 'movie' | 'tv', listName: string, page = 1) {
  const url = listName === 'trending' 
    ? `${TMDB_BASE_URL}/trending/${type}/week?page=${page}`
    : `${TMDB_BASE_URL}/${type}/${listName}?page=${page}`
    
  const res = await fetch(url, { headers: getHeaders() })
  if (!res.ok) throw new Error(`TMDb list fetch failed: ${res.statusText}`)
  const data = await res.json()
  return data.results || []
}

export async function getTmdbDetails(type: 'movie' | 'tv', tmdbId: number) {
  const res = await fetch(`${TMDB_BASE_URL}/${type}/${tmdbId}?append_to_response=credits,videos,release_dates,watch/providers,keywords`, {
    headers: getHeaders()
  })
  if (!res.ok) return null
  return await res.json()
}
