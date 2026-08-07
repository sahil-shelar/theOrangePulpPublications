// Fixed template registry for generated Rankings articles.
//
// Deliberately a closed set rather than a free-text prompt. Each template maps
// to one TMDB /discover query, so the facts handed to the model are fully
// determined by the query — an editor cannot ask for an angle the data does not
// support ("thrillers that flopped but aged well" has no TMDB signal, so the
// model would fill the gap from training data).
//
// Adding a template means adding a query that provably supports its claim.

import {
  discoverTmdbMovies,
  getTmdbGenreMap,
  getTmdbPersonDirectedMovies,
  searchTmdbPerson,
  type TmdbDiscoverResult,
} from '@/lib/services/tmdb'

/** Floor on vote_count so `vote_average.desc` cannot surface 1-vote 10.0 titles. */
const MIN_VOTES = { year: 200, decade: 500, director: 150 } as const

const MIN_ITEMS = 5
const MAX_ITEMS = 15

export type TemplateId = 'best_genre_year' | 'highest_rated_genre_decade' | 'top_by_director'

export type TemplateParams = {
  genre?: string
  year?: number
  decade?: number
  person?: string
  count?: number
}

export type ResolvedTemplate = {
  /** Proposed headline. The model may polish it but not contradict it. */
  title: string
  /** One-line framing handed to the model, derived from the query — not free text. */
  angle: string
  movies: TmdbDiscoverResult[]
  /** Canonical constraints, so a later part can exclude these films. */
  signature: string
}

export type SortMode = 'rating' | 'popularity' | 'recent' | 'revenue'

/**
 * Canonical description of a query's constraints.
 *
 * Lives here rather than in intent.ts so BOTH entry points can produce the same
 * shape — a fixed template and the free-text parser must agree, or a "part 2"
 * typed into the dashboard could never continue from a cron-generated list.
 *
 * Deliberately excludes count and part number: "10 best horror movies" and
 * "another five horror movies" are the same list continued.
 *
 * Canonicalised hard — genre ids sorted numerically, director as a stable TMDB id
 * rather than a typed name — because the two halves of a part-1/part-2 pair come
 * from two separate LLM calls and only match if normalisation removes the wobble.
 */
export function buildSignature(parts: {
  genreIds: number[]
  providerId?: number | null
  personId?: number | null
  yearFrom?: number | null
  yearTo?: number | null
  sort: SortMode
}): string {
  return [
    `g=${[...parts.genreIds].sort((a, b) => a - b).join('|')}`,
    `p=${parts.providerId ?? ''}`,
    `d=${parts.personId ?? ''}`,
    `y=${parts.yearFrom ?? ''}-${parts.yearTo ?? ''}`,
    `s=${parts.sort}`,
  ].join(';')
}

/**
 * Reads the sort mode back out of a stored signature.
 *
 * The signature is already the only persisted record of how a ranking was
 * ordered, so the detail page can tell a revenue list from a rating one
 * without a second column. Returns null for hand-made rankings and for any
 * draft written before signatures existed — callers must treat that as
 * "unknown", not as a default mode.
 */
export function readSignatureSort(signature: string | null | undefined): SortMode | null {
  if (!signature) return null
  const match = /(?:^|;)s=([a-z]+)/.exec(signature)
  const mode = match?.[1]
  return mode === 'rating' || mode === 'popularity' || mode === 'recent' || mode === 'revenue'
    ? mode
    : null
}

export type TemplateField = {
  name: keyof TemplateParams
  label: string
  type: 'text' | 'number'
  required: boolean
  placeholder?: string
}

export type TemplateDef = {
  id: TemplateId
  label: string
  /** Field declarations so the dashboard form is generated from the same source
   *  of truth the resolver reads. */
  fields: TemplateField[]
  resolve: (params: TemplateParams) => Promise<ResolvedTemplate>
}

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

function clampCount(count?: number) {
  // Number.isFinite guards NaN specifically: Math.min/max propagate it, and a
  // NaN count made `slice(0, NaN)` return an empty list, which produced a
  // zero-item article that still saved successfully.
  if (!Number.isFinite(count)) return 10
  return Math.min(Math.max(count as number, MIN_ITEMS), MAX_ITEMS)
}

async function resolveGenreId(genre?: string) {
  if (!genre) throw new Error('Genre is required.')
  const map = await getTmdbGenreMap()
  const id = map[genre.trim().toLowerCase()]
  if (!id) {
    throw new Error(
      `Unknown TMDB genre "${genre}". Valid: ${Object.keys(map).sort().join(', ')}`
    )
  }
  return id
}

/**
 * Fewer results than asked for means the ranking would be padded — reject.
 *
 * Note this deliberately accepts a SHORT list: asking for 15 and getting 8 is a
 * fine article, so the floor is MIN_ITEMS rather than the requested count. That
 * makes `selected.length` — not `count` — the only honest number to put in a
 * headline. A template that wrote "The 15 Best Films Directed by X" over eight
 * rows was claiming seven films it did not have.
 */
function requireEnough(movies: TmdbDiscoverResult[], count: number, what: string) {
  const floor = Math.min(count, MIN_ITEMS)
  if (movies.length < floor) {
    throw new Error(`TMDB returned only ${movies.length} qualifying titles for ${what}; need at least ${floor}.`)
  }
  const selected = movies.slice(0, count)
  // Belt and braces: nothing downstream should ever receive an empty list, and
  // a slice can only be empty here if count was not a sane positive integer.
  if (selected.length < MIN_ITEMS) {
    throw new Error(`Selected only ${selected.length} titles for ${what} (count=${count}); need at least ${MIN_ITEMS}.`)
  }
  return selected
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  best_genre_year: {
    id: 'best_genre_year',
    label: 'Best {genre} films of {year}',
    fields: [
      { name: 'genre', label: 'Genre', type: 'text', required: true, placeholder: 'thriller' },
      { name: 'year', label: 'Year', type: 'number', required: true, placeholder: '2019' },
      { name: 'count', label: 'How many', type: 'number', required: false, placeholder: '10' },
    ],
    async resolve(params) {
      const count = clampCount(params.count)
      const genreId = await resolveGenreId(params.genre)
      const year = params.year
      if (!year) throw new Error('Year is required.')

      const results = await discoverTmdbMovies({
        with_genres: genreId,
        primary_release_year: year,
        sort_by: 'vote_average.desc',
        'vote_count.gte': MIN_VOTES.year,
      })

      const genre = titleCase(params.genre!.trim())
      // Count comes from what TMDB actually returned, not from what was asked
      // for — see requireEnough.
      const movies = requireEnough(results, count, `${genre} ${year}`)
      return {
        title: `The Best ${genre} Films of ${year}`,
        angle: `The ${movies.length} highest-rated ${genre.toLowerCase()} films released in ${year}, ordered by audience score.`,
        movies,
        signature: buildSignature({ genreIds: [genreId], yearFrom: year, yearTo: year, sort: 'rating' }),
      }
    },
  },

  highest_rated_genre_decade: {
    id: 'highest_rated_genre_decade',
    label: 'Highest rated {genre} of the {decade}s',
    fields: [
      { name: 'genre', label: 'Genre', type: 'text', required: true, placeholder: 'science fiction' },
      { name: 'decade', label: 'Decade start year', type: 'number', required: true, placeholder: '1990' },
      { name: 'count', label: 'How many', type: 'number', required: false, placeholder: '10' },
    ],
    async resolve(params) {
      const count = clampCount(params.count)
      const genreId = await resolveGenreId(params.genre)
      const decade = params.decade
      if (!decade) throw new Error('Decade start year is required.')
      if (decade % 10 !== 0) throw new Error(`Decade must start on a round ten, got ${decade}.`)

      const results = await discoverTmdbMovies({
        with_genres: genreId,
        'primary_release_date.gte': `${decade}-01-01`,
        'primary_release_date.lte': `${decade + 9}-12-31`,
        sort_by: 'vote_average.desc',
        'vote_count.gte': MIN_VOTES.decade,
      })

      const genre = titleCase(params.genre!.trim())
      const movies = requireEnough(results, count, `${genre} ${decade}s`)
      return {
        title: `The Highest Rated ${genre} Films of the ${decade}s`,
        angle: `The ${movies.length} best-scored ${genre.toLowerCase()} films released between ${decade} and ${decade + 9}, ordered by audience score.`,
        movies,
        signature: buildSignature({ genreIds: [genreId], yearFrom: decade, yearTo: decade + 9, sort: 'rating' }),
      }
    },
  },

  top_by_director: {
    id: 'top_by_director',
    label: 'Top {N} films by {director}',
    fields: [
      { name: 'person', label: 'Director', type: 'text', required: true, placeholder: 'Denis Villeneuve' },
      { name: 'count', label: 'How many', type: 'number', required: false, placeholder: '10' },
    ],
    async resolve(params) {
      const count = clampCount(params.count)
      if (!params.person) throw new Error('Director name is required.')

      const person = await searchTmdbPerson(params.person)
      if (!person) throw new Error(`No TMDB person found for "${params.person}".`)

      // Credits filtered on job === 'Director', not /discover&with_crew — see
      // getTmdbPersonDirectedMovies. A producer credit must not land in a list
      // headlined "directed by".
      const results = await getTmdbPersonDirectedMovies(person.id, MIN_VOTES.director)
      // The number in the headline is the number of films in the list. Asking
      // for 15 and getting 8 used to publish "The 15 Best Films Directed by X"
      // over eight rows.
      const movies = requireEnough(results, count, person.name)

      return {
        title: `The ${movies.length} Best Films Directed by ${person.name}`,
        // TMDB's name is used rather than the editor's typed string so the
        // headline cannot carry a misspelling into a published article.
        angle: `${person.name}'s ${movies.length} highest-rated films, ordered by audience score.`,
        movies,
        signature: buildSignature({ genreIds: [], personId: person.id, sort: 'rating' }),
      }
    },
  },
}

export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[]

export function isTemplateId(value: string): value is TemplateId {
  return value in TEMPLATES
}
