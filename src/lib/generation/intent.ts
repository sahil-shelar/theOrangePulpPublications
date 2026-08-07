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
import { buildSignature, type ResolvedTemplate } from '@/lib/generation/templates'

const MIN_ITEMS = 5
const MAX_ITEMS = 15
const WATCH_REGION = 'US'

/**
 * Floor on vote_count, scaled to how broad the query is.
 *
 * A flat low floor produced garbage: "10 best horror movies" with a floor of 150
 * returned Succubus, La Leyenda de los Chaneques and Michael Jackson's Thriller
 * ahead of Alien and The Shining, because an obscure title with 160 votes at 8.0
 * outranks a canonical one at 7.9. The narrower the query, the smaller the
 * legitimate pool, so the floor has to come down with it.
 */
function voteFloor(opts: { sort: ParsedIntent['sort']; hasPerson: boolean; hasProvider: boolean; hasYearBound: boolean }) {
  // Only a rating sort can be gamed by a tiny vote count. Sorting by revenue,
  // popularity or date already puts substantial films first, so a high floor
  // there would just discard legitimate results.
  if (opts.sort !== 'rating') return 100
  // A director's filmography is small and every entry is legitimately theirs.
  if (opts.hasPerson) return 150
  // A provider or period genuinely narrows the pool.
  if (opts.hasProvider || opts.hasYearBound) return 600
  // Genre alone across all of cinema — only well-known films belong here.
  return 3000
}

/**
 * TMDB genre 10770 is "TV Movie"; excluding it keeps broadcast specials out of a
 * movie ranking. The runtime floor drops shorts and music videos — it is what
 * removes "Michael Jackson's Thriller" (14 min) and Doctor Who specials.
 */
const EXCLUDE_GENRES = 10770
const MIN_RUNTIME = 60

/** How many TMDB result pages to pull when earlier parts must be excluded. */
const MAX_PAGES = 3

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
  sort: 'rating' | 'popularity' | 'recent' | 'revenue'
  part: number
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
    sort: { type: Type.STRING, enum: ['rating', 'popularity', 'recent', 'revenue'], description: 'How to order the films. Use revenue for highest-grossing / biggest box office.' },
    part: {
      type: Type.INTEGER,
      description:
        'Which instalment of a continuing list. 1 unless the topic asks for a follow-up ("part 2", "part two", "more", "another 10"), in which case 2 or the stated number.',
    },
  },
  required: ['supported', 'reason', 'headline', 'angle', 'genres', 'provider', 'person', 'year_from', 'year_to', 'count', 'sort', 'part'],
  propertyOrdering: ['supported', 'reason', 'headline', 'angle', 'genres', 'provider', 'person', 'year_from', 'year_to', 'count', 'sort', 'part'],
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
  - ordering by audience rating, by popularity, by most recent, or by box
    office revenue (use this for "highest grossing", "biggest box office",
    "biggest hits")
  - how many films

Set supported = false when the topic depends on anything else. Things the
database does NOT record, and which you must refuse rather than approximate:
whether a film flopped or lost money, awards, critical vs audience divergence,
"underrated", "aged well", "hidden gems", mood or occasion with no genre reading,
runtime suitability, content warnings, actor-led lists.

Note the asymmetry on money: gross revenue IS recorded, so "highest grossing" is
supported via sort = revenue. A flop is not — it needs budget compared against
revenue plus context the database cannot settle.

One exception to that: revenue is NOT recorded against a single director's
credits. "The highest grossing Spielberg films" is not supported — set supported
= false and say the box-office figures are not available per director. Ranking by
revenue across a genre, a period or a streaming service is fine.

Judgement you SHOULD make: an occasion or vibe that has a fair genre reading is
supported — translate it. "Netflix and chill" is Netflix availability plus
romance and comedy. "Halloween night" is horror. Say what you did in the angle.

The topic MUST end up with at least one of: a genre, a provider, a director, or a
year bound. A topic that constrains nothing is not supported — an unconstrained
list of "good films" is not an article.

headline: may keep the editor's framing, including a vibe phrase. It must not
claim anything the query does not constrain — no "award-winning", no "critically
acclaimed", no runtime claims, and no reference to streaming unless a provider is
actually set. (A part-2 run once produced "Streaming Horror: The Next Wave" for a
query with no provider at all. Do not do that.)

angle: state plainly what the query actually selects, so a human reviewing the
draft can judge whether the framing was fair. Mention the service by name when
one is used.

part: a follow-up request ("part 2", "another ten", "more horror") is the SAME
query as the original, just a later instalment. Emit identical constraints and set
part accordingly — do not add or change a genre, provider or year bound to make it
look different. The films already used are excluded automatically, and that only
works if the constraints match the earlier run exactly.`

/** What the parser produced plus how it was resolved, for display to the editor. */
export type ResolvedIntent = {
  resolved: ResolvedTemplate
  intent: ParsedIntent
  /** Human-readable account of the query that ran. */
  queryDescription: string
  /** Canonical constraints, stored so later parts can exclude these films. */
  querySignature: string
  /** tmdb_ids skipped because an earlier part already used them. */
  excludedCount: number
}

export class UnsupportedTopicError extends Error {}

function clampCount(count: number) {
  if (!Number.isFinite(count)) return 10
  return Math.min(Math.max(count, MIN_ITEMS), MAX_ITEMS)
}

/** tmdb_ids already featured in earlier articles built from the same query. */
async function alreadyFeatured(signature: string): Promise<{ ids: Set<number>; articleCount: number }> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data: priorArticles } = await supabase
    .from('articles')
    .select('id')
    .eq('query_signature', signature)

  if (!priorArticles?.length) return { ids: new Set(), articleCount: 0 }

  const { data: items } = await supabase
    .from('list_items')
    .select('movies(tmdb_id)')
    .in('article_id', priorArticles.map(a => a.id))

  const ids = new Set<number>()
  for (const row of items ?? []) {
    const tmdbId = (row as any).movies?.tmdb_id
    if (typeof tmdbId === 'number') ids.add(tmdbId)
  }

  return { ids, articleCount: priorArticles.length }
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

    // A director query is served from movie_credits, which carries no revenue
    // field — so "the highest grossing Spielberg films" cannot be answered, only
    // approximated by vote count. The model would still emit a headline claiming
    // box office, so this is refused rather than silently reordered. Same
    // asymmetry the parser instruction already draws for flops: the data either
    // settles the claim or it does not.
    if (intent.sort === 'revenue') {
      throw new UnsupportedTopicError(
        `TMDB's credits for ${person.name} do not carry box-office figures, so a "highest grossing" list of one director's films cannot be built. Try ordering by audience score instead, or drop the director and rank by revenue across a genre or period.`
      )
    }

    described.push(`directed by ${person.name}`)
  }

  const yearFrom = intent.year_from > 0 ? intent.year_from : null
  const yearTo = intent.year_to > 0 ? intent.year_to : null
  if (yearFrom || yearTo) described.push(`released ${yearFrom ?? 'any'}–${yearTo ?? 'any'}`)

  // A query with no constraints is an unfiltered sweep of "good films", which is
  // not an article. Enforced in code, not left to the model's own `supported`
  // flag — a model that approves everything would make that flag decoration.
  //
  // Exception: a revenue sort is self-defining. "The 10 highest grossing films of
  // all time" needs no genre or period — the ordering IS the premise, and the
  // answer is objective. Only the subjective sorts need narrowing, which is what
  // keeps "weekend watch" (unconstrained + rating) refused.
  const hasConstraint = genreIds.length > 0 || providerId || person || yearFrom || yearTo
  if (!hasConstraint && intent.sort !== 'revenue') {
    throw new UnsupportedTopicError(
      'That topic does not narrow to anything queryable — no genre, streaming service, director or time period. Try naming one.'
    )
  }
  if (!hasConstraint) described.unshift('all films')

  // Describe the ordering that ACTUALLY ran, not the one that was asked for.
  //
  // This string is not cosmetic: it flows into queryDescription, then into the
  // angle handed to the prose model (see the return below), so a wrong one tells
  // the writer — and the reviewing editor — that the list was ranked on
  // something it was not. `revenue` + a director is refused above; `popularity`
  // still degrades to a vote_count sort in moviesByDirector, so say so.
  described.push(
    intent.sort === 'rating' ? 'ordered by audience score'
      : intent.sort === 'popularity'
        ? person ? 'ordered by vote count (TMDB credits carry no popularity score)' : 'ordered by popularity'
      : intent.sort === 'revenue' ? 'ordered by worldwide gross (TMDB-reported, not inflation-adjusted)'
      : 'newest first'
  )

  const querySignature = buildSignature({
    genreIds, providerId, personId: person?.id ?? null, yearFrom, yearTo, sort: intent.sort,
  })

  // A follow-up instalment must not repeat part one. The query itself is
  // deterministic, so without this "part 2" returns byte-identical films.
  const part = Number.isFinite(intent.part) ? Math.max(1, Math.trunc(intent.part)) : 1
  let excluded = new Set<number>()

  if (part > 1) {
    const prior = await alreadyFeatured(querySignature)
    if (prior.articleCount === 0) {
      throw new UnsupportedTopicError(
        'No earlier part exists for this query, so there is nothing to continue from. Generate part one first.'
      )
    }
    excluded = prior.ids
    described.push(`excluding ${excluded.size} films from ${prior.articleCount} earlier part(s)`)
  }

  const pool = person
    ? await moviesByDirector(person.id, yearFrom, yearTo, intent.sort)
    : await moviesByDiscover({ genreIds, providerId, yearFrom, yearTo, sort: intent.sort },
        // Only page deeper when earlier parts have eaten into the top results.
        excluded.size > 0 ? MAX_PAGES : 1)

  const movies = pool.filter(m => !excluded.has(m.tmdb_id))

  if (movies.length < MIN_ITEMS) {
    throw new UnsupportedTopicError(
      excluded.size > 0
        ? `Only ${movies.length} unused films are left for this query after excluding ${excluded.size} already featured; a ranking needs at least ${MIN_ITEMS}. Earlier parts have exhausted it.`
        : `Only ${movies.length} films match that query; a ranking needs at least ${MIN_ITEMS}. Try loosening it.`
    )
  }

  const selected = movies.slice(0, count)

  // The parser's headline is written from the requested count ("The 10 Best
  // Horror Films"), but a query can legitimately return fewer than that and
  // still make an article. Tell the prose step how many films it actually has so
  // the headline it polishes matches the list underneath it.
  if (selected.length < count) {
    described.push(`${selected.length} films available, not the ${count} requested`)
  }

  const queryDescription = described.join(' · ')

  return {
    intent,
    queryDescription,
    querySignature,
    excludedCount: excluded.size,
    resolved: {
      signature: querySignature,
      title: intent.headline,
      // The angle handed to the prose step states what the query selected, so the
      // blurb writer is anchored to the query rather than to the vibe phrase.
      angle: `${intent.angle} (Query: ${queryDescription}. The list has exactly ${selected.length} films — any number in the headline must be ${selected.length}.)`,
      movies: selected,
    },
  }
}

const SORT_PARAM = {
  rating: 'vote_average.desc',
  popularity: 'popularity.desc',
  recent: 'primary_release_date.desc',
  revenue: 'revenue.desc',
} as const

async function moviesByDiscover(
  opts: {
    genreIds: number[]
    providerId: number | null
    yearFrom: number | null
    yearTo: number | null
    sort: ParsedIntent['sort']
  },
  pages = 1
) {
  const params: Record<string, string | number> = {
    sort_by: SORT_PARAM[opts.sort],
    'vote_count.gte': voteFloor({
      sort: opts.sort,
      hasPerson: false,
      hasProvider: Boolean(opts.providerId),
      hasYearBound: Boolean(opts.yearFrom || opts.yearTo),
    }),
    without_genres: EXCLUDE_GENRES,
    'with_runtime.gte': MIN_RUNTIME,
  }
  if (opts.genreIds.length) params.with_genres = opts.genreIds.join(',')
  if (opts.providerId) {
    params.with_watch_providers = opts.providerId
    params.watch_region = WATCH_REGION
  }
  if (opts.yearFrom) params['primary_release_date.gte'] = `${opts.yearFrom}-01-01`
  if (opts.yearTo) params['primary_release_date.lte'] = `${opts.yearTo}-12-31`

  // Pages are concatenated and de-duplicated rather than requesting page N alone:
  // `vote_average.desc` can reorder between calls as vote counts move, so "page 2"
  // is not a stable window onto results 21-40.
  const seen = new Set<number>()
  const all: TmdbDiscoverResult[] = []

  for (let page = 1; page <= pages; page++) {
    const batch = await discoverTmdbMovies({ ...params, page })
    if (batch.length === 0) break
    for (const m of batch) {
      if (seen.has(m.tmdb_id)) continue
      seen.add(m.tmdb_id)
      all.push(m)
    }
  }

  return all
}

async function moviesByDirector(
  personId: number,
  yearFrom: number | null,
  yearTo: number | null,
  sort: ParsedIntent['sort']
) {
  // job === 'Director' credits, not /discover&with_crew — a producer credit must
  // not land in a list headlined "directed by".
  let films = await getTmdbPersonDirectedMovies(
    personId,
    voteFloor({ sort, hasPerson: true, hasProvider: false, hasYearBound: Boolean(yearFrom || yearTo) })
  )

  if (yearFrom) films = films.filter(f => (f.release_year ?? 0) >= yearFrom)
  if (yearTo) films = films.filter(f => (f.release_year ?? 9999) <= yearTo)

  if (sort === 'recent') {
    films = films.slice().sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0))
  } else if (sort === 'popularity') {
    // movie_credits carries no popularity score; vote_count is the closest proxy
    // for reach. resolveTopic says so in the query description rather than
    // letting the list claim an ordering it does not have.
    films = films.slice().sort((a, b) => b.vote_count - a.vote_count)
  }
  // 'rating' is already the order getTmdbPersonDirectedMovies returns.
  // 'revenue' never reaches here — resolveTopic refuses director + revenue,
  // because movie_credits carries no revenue and the headline would claim one.

  return films as TmdbDiscoverResult[]
}
