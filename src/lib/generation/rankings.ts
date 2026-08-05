// Generate a Rankings (type: 'list') article draft from a fixed template.
//
// Pipeline: template -> TMDB /discover -> upsert movies -> Gemini rewrite ->
// validate against the supplied facts -> insert article + list_items as a DRAFT.
//
// Two things this module refuses to do, both deliberate:
//
//  1. It never publishes. `status` is always 'draft'. TMDB data is
//     user-contributed and the model demonstrably adds plot detail that was not
//     supplied (measured 2026-08-06: given only title/year/director/genre it
//     produced "every staircase and hidden room", "music conservatory",
//     "every translated phrase" — none of which were in the input). A human
//     must read it. Supplying TMDB `overview` lowers that pressure but verifies
//     nothing.
//
//  2. It never writes `pull_quote`. That field renders at 4xl in quotation
//     marks and reads as attributable to a named person. A generated one is a
//     fabricated quote.

import { Type } from '@google/genai'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateJson } from '@/lib/services/gemini'
import { getTmdbMovieDetails, parseTmdbToInternalMovie, type TmdbDiscoverResult } from '@/lib/services/tmdb'
import { TEMPLATES, type TemplateId, type TemplateParams } from '@/lib/generation/templates'

const MIN_BLURB_WORDS = 15
const MAX_BLURB_WORDS = 60

const SYSTEM_INSTRUCTION = `You write rankings for The Orange Pulp, a film publication with a dry, confident house voice.

Rules, in priority order:

1. FACTS ARE FIXED. Use only the facts supplied for each film. Never add a fact —
   no plot points, no awards, no box office, no critical reception, no cast names
   that were not supplied. This includes attribution: do not name a director,
   country, language or studio unless it appears in that film's facts. If a field
   is absent, write around it.

2. THE SYNOPSIS IS A FENCE, NOT A SOURCE. It is supplied so you know what the
   film is and cannot invent — it is not material to paraphrase. Do not summarise
   the plot. Do not recount what happens, who does it, or how it escalates.
   Anything you say must stay inside the fence the synopsis draws, but the
   sentence you write is about the film as a piece of work: what it does to a
   viewer, what its craft is aimed at, why it sits where it sits on this list.

   Wrong (plot summary): "A retired courier takes one last job, only for the
   handoff to go wrong and force him back into a life he had abandoned."
   Right (a take):       "Every frame is built around what the camera withholds,
   so the eventual violence lands as confirmation rather than surprise."

   The two lines above are about an unnamed hypothetical film and exist only to
   show the difference in register. Never reuse their wording or imagery.

3. Do not restate a film's title, year, director or genre as metadata. Naming the
   director while making a claim about their work is fine; "this 2019 thriller
   directed by X" is not.

4. Every blurb must open with a different word.

5. 25-35 words per blurb. One idea, stated with conviction.

6. \`rank\` and \`title\` must be reproduced exactly as supplied. Never reorder,
   renumber, rename, add or drop a film.

Voice: assured, specific, unfussy. No hype adjectives (stunning, masterpiece,
unforgettable, must-watch). No rhetorical questions. No "arguably". No
"a breeding ground for", "a testament to", or similar filler scaffolding.`

const LIST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'Polished headline. Must not contradict the supplied angle.' },
    intro: { type: Type.STRING, description: 'One or two sentences introducing the list. 30-50 words.' },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rank: { type: Type.INTEGER },
          title: { type: Type.STRING },
          blurb: { type: Type.STRING },
        },
        required: ['rank', 'title', 'blurb'],
        propertyOrdering: ['rank', 'title', 'blurb'],
      },
    },
  },
  required: ['headline', 'intro', 'items'],
  propertyOrdering: ['headline', 'intro', 'items'],
}

type GeneratedList = {
  headline: string
  intro: string
  items: { rank: number; title: string; blurb: string }[]
}

/** A film's facts as handed to the model. Director and country are included
 *  because without them the model asserted both anyway from training data
 *  ("Todd Phillips", "Argentine") — correct, but unsupplied and therefore
 *  unverifiable. Supplying them turns invention into attribution. */
type MovieFacts = TmdbDiscoverResult & {
  director: string | null
  countries: string[]
}

function buildFactsPrompt(angle: string, movies: MovieFacts[]) {
  const lines = movies.map((m, i) => {
    const parts = [
      `rank ${i + 1}`,
      `title: ${m.title}`,
      m.release_year ? `year: ${m.release_year}` : null,
      m.director ? `director: ${m.director}` : null,
      m.countries.length ? `country: ${m.countries.join(', ')}` : null,
      m.vote_average != null ? `audience score: ${m.vote_average}/10 (${m.vote_count} votes)` : null,
      // The synopsis is included specifically so the model knows what the film
      // is and does not need to invent any of it. See rule 2 — it is a fence.
      m.overview ? `synopsis: ${m.overview}` : 'synopsis: (none available — do not invent one)',
    ].filter(Boolean)
    return parts.join('\n  ')
  })

  return `Angle: ${angle}

Films, already in final ranked order — do not reorder:

${lines.join('\n\n')}`
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

/** Resolve the author generated drafts are attributed to. */
async function resolveAuthorId(supabase: ReturnType<typeof createAdminClient>) {
  if (process.env.GENERATED_AUTHOR_ID) return process.env.GENERATED_AUTHOR_ID

  const { data } = await supabase.from('authors').select('id, name').limit(50)
  if (!data?.length) return null
  const editorial = data.find(a => /editorial|orange pulp|staff/i.test(a.name ?? ''))
  return (editorial ?? data[0]).id
}

async function uniqueSlug(supabase: ReturnType<typeof createAdminClient>, base: string) {
  for (let suffix = 0; suffix < 20; suffix++) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`
    const { data } = await supabase.from('articles').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
  }
  throw new Error(`Could not find a free slug for "${base}".`)
}

/**
 * Verify the model returned exactly the films it was given, at exactly the
 * ranks it was given.
 *
 * This is not defensive padding: gemini-2.5-flash was observed attaching the
 * wrong film's blurb to rank 1. Left unchecked that binds a blurb to the wrong
 * movie_id under list_items' UNIQUE(article_id, rank) and renders publicly.
 * A mismatch rejects the whole generation rather than partially trusting it.
 */
function assertFaithful(generated: GeneratedList, movies: TmdbDiscoverResult[]) {
  const expected = new Map(movies.map((m, i) => [i + 1, m.title]))

  if (generated.items.length !== movies.length) {
    throw new Error(`Model returned ${generated.items.length} items, expected ${movies.length}.`)
  }

  for (const item of generated.items) {
    const want = expected.get(item.rank)
    if (want === undefined) throw new Error(`Model invented rank ${item.rank}.`)
    if (item.title.trim() !== want) {
      throw new Error(`Rank ${item.rank} should be "${want}" but the model returned "${item.title}".`)
    }
    const words = item.blurb.trim().split(/\s+/).filter(Boolean).length
    if (words < MIN_BLURB_WORDS || words > MAX_BLURB_WORDS) {
      throw new Error(`Rank ${item.rank} blurb is ${words} words, outside ${MIN_BLURB_WORDS}-${MAX_BLURB_WORDS}.`)
    }
  }

  const ranks = new Set(generated.items.map(i => i.rank))
  if (ranks.size !== generated.items.length) throw new Error('Model returned duplicate ranks.')
}

export type GenerateRankingResult = {
  articleId: string
  slug: string
  title: string
  model: string
  usage: { input: number; output: number; thoughts: number; total: number }
  itemCount: number
}

export async function generateRankingDraft(
  templateId: TemplateId,
  params: TemplateParams
): Promise<GenerateRankingResult> {
  const template = TEMPLATES[templateId]
  if (!template) throw new Error(`Unknown template "${templateId}".`)

  const { title, angle, movies } = await template.resolve(params)
  const supabase = createAdminClient()

  // Upsert the films first: list_items.movie_id needs to point at real rows,
  // full details give the movie pages something to render, and the same fetch
  // supplies the director/country facts the prompt needs.
  const enriched = await Promise.all(
    movies.map(async (m): Promise<{ id: string | null; facts: MovieFacts }> => {
      const details = await getTmdbMovieDetails(m.tmdb_id)
      const parsed = details ? parseTmdbToInternalMovie(details) : null
      const facts: MovieFacts = {
        ...m,
        director: parsed?.director || null,
        countries: (details?.production_countries ?? []).map((c: any) => c.name).filter(Boolean),
      }
      if (!parsed) return { id: null, facts }

      const year = parsed.release_date?.split('-')[0]
      const { data, error } = await supabase
        .from('movies')
        .upsert(
          {
            title: parsed.title,
            original_title: parsed.original_title,
            slug: slugify(`${parsed.title}${year ? `-${year}` : ''}`),
            synopsis: parsed.synopsis,
            poster_url: parsed.poster_url,
            backdrop_url: parsed.backdrop_url,
            runtime: parsed.runtime,
            release_date: parsed.release_date || null,
            release_year: year ? parseInt(year, 10) : null,
            director: parsed.director,
            trailer_url: parsed.trailer_url,
            certification: parsed.certification,
            tmdb_id: parsed.tmdb_id,
            metadata: parsed.metadata,
          },
          { onConflict: 'tmdb_id', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (error) {
        console.error(`Movie upsert failed for ${parsed.title}:`, error.message)
        return { id: null, facts }
      }
      return { id: data.id, facts }
    })
  )

  const movieIds = enriched.map(e => e.id)
  const facts = enriched.map(e => e.facts)

  const { data: generated, model, usage } = await generateJson<GeneratedList>({
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: buildFactsPrompt(angle, facts),
    schema: LIST_SCHEMA,
  })

  assertFaithful(generated, movies)

  const authorId = await resolveAuthorId(supabase)
  const slug = await uniqueSlug(supabase, slugify(generated.headline || title))

  const { data: article, error: articleError } = await supabase
    .from('articles')
    .insert({
      title: generated.headline || title,
      slug,
      type: 'list',
      // Never 'published'. See the module header.
      status: 'draft',
      excerpt: generated.intro,
      content: generated.intro,
      author_id: authorId,
      cover_image_url: movies[0]?.poster_url ?? null,
      seo_title: (generated.headline || title).slice(0, 60),
      seo_description: generated.intro.slice(0, 155),
    })
    .select('id, slug, title')
    .single()

  if (articleError) throw new Error(`Article insert failed: ${articleError.message}`)

  const { error: itemsError } = await supabase.from('list_items').insert(
    generated.items
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map(item => ({
        article_id: article.id,
        rank: item.rank,
        movie_id: movieIds[item.rank - 1] ?? null,
        custom_title: item.title,
        blurb: item.blurb,
        item_rating: movies[item.rank - 1]?.vote_average ?? null,
      }))
  )

  if (itemsError) {
    // An article with no items is worse than none — it renders as an empty list.
    await supabase.from('articles').delete().eq('id', article.id)
    throw new Error(`list_items insert failed, article rolled back: ${itemsError.message}`)
  }

  return {
    articleId: article.id,
    slug: article.slug,
    title: article.title,
    model,
    usage,
    itemCount: generated.items.length,
  }
}
