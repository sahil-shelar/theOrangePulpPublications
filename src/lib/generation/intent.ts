// Turn a free-text editorial topic into a TMDB query.
//
// The model is used here as a PARSER, not as a source of facts. It reads
// "netflix and chill" and decides *which query to run*; TMDB still decides which
// films come back and in what order. That distinction is the whole safety
// argument for allowing free text at all:
//
//   free text -> query parameters (model)  -> films + facts (TMDB) -> prose (model, fenced)
//
// Everything the parser emits is validated against live TMDB lookups before use.
// A genre or provider the model invented is a hard failure, not a silently
// dropped filter — dropping it would leave an unconstrained `vote_average.desc`
// sweep that still returns plenty of rows, so nothing downstream would notice.

import { Type } from '@google/genai'
import { generateJson } from '@/lib/services/gemini'
import {
  discoverTmdbMovies,
  getTmdbGenreMap,
  getTmdbPersonDirectedMovies,
  getTmdbWatchProviders,
  searchTmdbPerson,
  type TmdbDiscoverResult,
} from '@/lib/services/tmdb'
import type { ResolvedTemplate } from '@/lib/generation/templates'

const MIN_ITEMS = 5
const MAX_ITEMS = 15
const WATCH_REGION = 'US'

/** Floors on vote_count so a rating sort cannot surface 1-vote 10.0 entries. */
const VOTE_FLOOR = { rating: 150, popularity: 50, recent: 50 } as const

export type ParsedIntent = {
  supported: boolean
  reason: string
  headline: string
  angle: string
  genres: string[]
  provider: string
  person: string
  year_from: number
  year_to: number
  count: number
  sort: 'rating' | 'popularity' | 'recent'
}

const INTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    supported: {
      type: Type.BOOLEAN,
      description:
        'True only if the topic can be expressed using the fields below. False if it depends on something TMDB does not record.',
    },
    reason: {
      type: Type.STRING,
      description:
        'When supported is false, one sentence naming exactly which part of the request TMDB cannot express. Empty string when supported.',
    },
    headline: { type: Type.STRING, description: 'Editorial headline for the list. May keep the requested framing.' },
    angle: { type: Type.STRING, description: 'One sentence stating plainly what the list contains, in terms of the query.' },
    genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'TMDB genre names. Empty array if none apply.' },
    provider: { type: Type.STRING, description: 'Streaming service name, e.g. "Netflix". Empty string if not requested.' },
    person: { type: Type.STRING, description: 'Director name, if the topic is about one. Empty string otherwise.' },
    year_from: { type: Type.INTEGER, description: 'Earliest release year, or 0 for no lower bound.' },
    year_to: { type: Type.INTEGER, description: 'Latest release year, or 0 for no upper bound.' },
    count: { type: Type.INTEGER, description: `How many films, ${MIN_ITEMS}-${MAX_ITEMS}. Default 10.` },
    sort: { type: Type.STRING, enum: ['rating', 'popularity', 'recent'], description: 'How to order the films.' },
  },
  required: ['supported', 'reason', 'headline', 'angle', 'genres', 'provider', 'person', 'year_from', 'year_to', 'count', 'sort'],
  propertyOrdering: ['supported', 'reason', 'headline', 'angle', 'genres', 'provider', 'person', 'year_from', 'year_to', 'count', 'sort'],
}

const PARSER_INSTRUCTION = `You convert an editor's topic for a film ranking into a database query.

You are choosing QUERY PARAMETERS. You are not choosing films, and you must not
name any film. The database returns the films.

The query can only express these things:
  - genre (TMDB genre names: Action, Adventure, Animation, Comedy, Crime,
    Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery,
    Romance, Science Fiction, TV Movie, Thriller, War, Western)
  - streaming availability on one named service in the US
  - one director
  - a release year range
  - ordering by audience rating, by popularity, or by most recent
  - how many films

Set supported = false when the topic depends on anything else. Things the
database does NOT record, and which you must refuse rather than approximate:
box office performance or flops, awards, critical vs audience divergence,
"underrated", "aged well", "hidden gems", mood or occasion with no genre reading,
runtime suitability, content warnings, actor-led lists.

Judgement you SHOULD make: an occasion or vibe that has a fair genre reading is
supported — translate it. "Netflix and chill" is Netflix availability plus
romance and comedy. "Halloween night" is horror. Say what you did in the angle.

The topic MUST end up with at least one of: a genre, a provider, a director, or a
year bound. A topic that constrains nothing is not supported — an unconstrained
list of "good films" is not an article.

headline: may keep the editor's framing, including a vibe phrase. It must not
claim anything the query does not constrain — no "award-winning", no "critically
acclaimed", no "streaming everywhere", no runtime claims.

angle: state plainly what the query actually selects, so a human reviewing the
draft can judge whether the framing was fair. Mention the service by name when
one is used.`

/** What the parser produced plus how it was resolved, for display to the editor. */
export type ResolvedIntent = {
  resolved: ResolvedTemplate
  intent: ParsedIntent
  /** Human-readable account of the query that ran. */
  queryDescription: string
}

export class UnsupportedTopicError extends Error {}

function clampCount(count: number) {
  if (!Number.isFinite(count)) return 10
  return Math.min(Math.max(count, MIN_ITEMS), MAX_ITEMS)
}

export async function parseTopic(topic: string): Promise<ParsedIntent> {
  const { data } = await generateJson<ParsedIntent>({
    systemInstruction: PARSER_INSTRUCTION,
    prompt: `Editor's topic: ${topic}`,
    schema: INTENT_SCHEMA,
    // Parsing should be repeatable, not creative.
    temperature: 0.2,
  })
  return data
}

export async function resolveTopic(topic: string): Promise<ResolvedIntent> {
  const intent = await parseTopic(topic)

  if (!intent.supported) {
    throw new UnsupportedTopicError(
      intent.reason || 'That topic cannot be expressed as a TMDB query.'
    )
  }

  const count = clampCount(intent.count)
  const described: string[] = []

  // --- genres: every name must exist, or the filter would silently vanish ---
  const genreIds: number[] = []
  if (intent.genres.length > 0) {
    const genreMap = await getTmdbGenreMap()
    for (const name of intent.genres) {
      const id = genreMap[name.trim().toLowerCase()]
      if (!id) {
        throw new UnsupportedTopicError(
          `"${name}" is not a TMDB genre. Valid genres: ${Object.keys(genreMap).sort().join(', ')}.`
        )
      }
      genreIds.push(id)
    }
    described.push(`genre: ${intent.genres.join(' + ')}`)
  }

  // --- provider ---
  let providerId: number | null = null
  if (intent.provider.trim()) {
    const providers = await getTmdbWatchProviders(WATCH_REGION)
    const id = providers[intent.provider.trim().toLowerCase()]
    if (!id) {
      throw new UnsupportedTopicError(
        `TMDB has no ${WATCH_REGION} streaming provider named "${intent.provider}".`
      )
    }
    providerId = id
    described.push(`streaming on ${intent.provider} (${WATCH_REGION})`)
  }

  // --- director ---
  let person: { id: number; name: string } | null = null
  if (intent.person.trim()) {
    person = await searchTmdbPerson(intent.person)
    if (!person) {
      throw new UnsupportedTopicError(`No TMDB person found for "${intent.person}".`)
    }
    described.push(`directed by ${person.name}`)
  }

  const yearFrom = intent.year_from > 0 ? intent.year_from : null
  const yearTo = intent.year_to > 0 ? intent.year_to : null
  if (yearFrom || yearTo) described.push(`released ${yearFrom ?? 'any'}–${yearTo ?? 'any'}`)

  // A query with no constraints is an unfiltered sweep of "good films", which is
  // not an article. Enforced in code, not left to the model's own `supported`
  // flag — a model that approves everything would make that flag decoration.
  if (genreIds.length === 0 && !providerId && !person && !yearFrom && !yearTo) {
    throw new UnsupportedTopicError(
      'That topic does not narrow to anything queryable — no genre, streaming service, director or time period. Try naming one.'
    )
  }

  described.push(
    intent.sort === 'rating' ? 'ordered by audience score'
      : intent.sort === 'popularity' ? 'ordered by popularity'
      : 'newest first'
  )

  const movies = person
    ? await moviesByDirector(person.id, yearFrom, yearTo, intent.sort)
    : await moviesByDiscover({ genreIds, providerId, yearFrom, yearTo, sort: intent.sort })

  if (movies.length < MIN_ITEMS) {
    throw new UnsupportedTopicError(
      `Only ${movies.length} films match that query; a ranking needs at least ${MIN_ITEMS}. Try loosening it.`
    )
  }

  const queryDescription = described.join(' · ')

  return {
    intent,
    queryDescription,
    resolved: {
      title: intent.headline,
      // The angle handed to the prose step states what the query selected, so the
      // blurb writer is anchored to the query rather than to the vibe phrase.
      angle: `${intent.angle} (Query: ${queryDescription}.)`,
      movies: movies.slice(0, count),
    },
  }
}

const SORT_PARAM = {
  rating: 'vote_average.desc',
  popularity: 'popularity.desc',
  recent: 'primary_release_date.desc',
} as const

async function moviesByDiscover(opts: {
  genreIds: number[]
  providerId: number | null
  yearFrom: number | null
  yearTo: number | null
  sort: ParsedIntent['sort']
}) {
  const params: Record<string, string | number> = {
    sort_by: SORT_PARAM[opts.sort],
    'vote_count.gte': VOTE_FLOOR[opts.sort],
  }
  if (opts.genreIds.length) params.with_genres = opts.genreIds.join(',')
  if (opts.providerId) {
    params.with_watch_providers = opts.providerId
    params.watch_region = WATCH_REGION
  }
  if (opts.yearFrom) params['primary_release_date.gte'] = `${opts.yearFrom}-01-01`
  if (opts.yearTo) params['primary_release_date.lte'] = `${opts.yearTo}-12-31`

  return discoverTmdbMovies(params)
}

async function moviesByDirector(
  personId: number,
  yearFrom: number | null,
  yearTo: number | null,
  sort: ParsedIntent['sort']
) {
  // job === 'Director' credits, not /discover&with_crew — a producer credit must
  // not land in a list headlined "directed by".
  let films = await getTmdbPersonDirectedMovies(personId, VOTE_FLOOR.rating)

  if (yearFrom) films = films.filter(f => (f.release_year ?? 0) >= yearFrom)
  if (yearTo) films = films.filter(f => (f.release_year ?? 9999) <= yearTo)

  if (sort === 'recent') {
    films = films.slice().sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0))
  } else if (sort === 'popularity') {
    films = films.slice().sort((a, b) => b.vote_count - a.vote_count)
  }
  // 'rating' is already the order getTmdbPersonDirectedMovies returns.

  return films as TmdbDiscoverResult[]
}
