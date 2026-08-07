// Generate a Spotlight (type: 'spotlight') article draft, triggered by a new
// release.
//
// The trigger is the whole point. A ranking is justified by its query — "the ten
// highest grossing films" is self-explaining. A spotlight is not: "why this
// person, why now" cannot be derived from a filmography, and without an answer
// the pipeline produces competent filler. So the subject is never chosen on
// merit; it is chosen because they directed something that came out this week.
//
// Always writes status: 'draft'. Nothing here publishes.
//
// Deliberately NOT sourced from TMDB's `biography`: it is user-contributed,
// frequently stale, and unverifiable at write time, so a model narrating a real
// person's life from it would be asserting biographical claims this pipeline
// cannot check. The article is built from filmography and the new release only —
// both structured fields — which is also why assertFaithful can police it.

import { Type } from '@google/genai'
import { generateJson } from '@/lib/services/gemini'
import {
  discoverTmdbMovies,
  getTmdbMovieDetails,
  getTmdbPersonDirectedMovies,
  parseTmdbToInternalMovie,
  type TmdbDiscoverResult,
} from '@/lib/services/tmdb'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAuthorId, slugify, uniqueSlug } from './drafts'

/** How far back "new release" reaches. A weekly cron with a 10-day window
 *  overlaps slightly rather than risking a gap on an off-by-one run. */
const WINDOW_DAYS = 10

/** Candidates to inspect before giving up. Each costs one TMDB detail fetch. */
const MAX_CANDIDATES = 8

/** Vote floor for prior work. 150 (the default elsewhere) rejected working
 *  directors outright — measured: Kate Dolan had 0 qualifying films at 150 and
 *  2 at 25 — while 0 would admit untracked entries with no audience signal. */
const PRIOR_VOTE_FLOOR = 25

/** Below this the Notable Works grid looks broken, which is worse than skipping
 *  the subject. Measured against one release window: 3 of 7 credited directors
 *  had no prior directed features at any floor. */
const MIN_PRIOR_WORKS = 3

/** Trigger film plus five, which fills the 2/3/4-column grid without a ragged
 *  final row at any breakpoint. */
const MAX_WORKS = 6

const MIN_NOTE_WORDS = 12
const MAX_NOTE_WORDS = 45
/** A floor to catch a body that is effectively empty, NOT a style rule. The
 *  schema asked for 120-200 and live runs landed at 103 and 76 — both perfectly
 *  good short paragraphs. Enforcing the target would have failed roughly half of
 *  all cron runs on word count alone, so the schema now asks for what the model
 *  actually produces and these bounds only reject unusable output. */
const MIN_BODY_WORDS = 55
const MAX_BODY_WORDS = 280

/** Distinct prefix so it can never collide with buildSignature's
 *  `g=;p=;d=;y=-;s=` shape in the same TEXT column. */
export function spotlightSignature(personTmdbId: number) {
  return `spotlight:person=${personTmdbId}`
}

/** No qualifying subject this window. Not a fault — the caller should report it
 *  as "nothing to write" rather than as a failure, the same way an unsupported
 *  topic is distinguished from a broken run. */
export class NoSpotlightSubjectError extends Error {}

const SYSTEM_INSTRUCTION = `You write Spotlight profiles for The Orange Pulp, a film publication with a dry, confident house voice.

Rules, in priority order:

1. FACTS ARE FIXED. Use only the facts supplied. Never add one — no biography, no
   birthplace, no training, no awards, no box office, no critical reception, no
   collaborators, no cast, no studio, no influences. You are given a filmography
   and a new release; that is the entire world of this piece. If you want to say
   something you were not given, write around it.

2. NO BIOGRAPHY. Do not narrate a life. You have not been told where this person
   is from, how they started, or what they are known for personally, and you must
   not infer any of it. Write about the work.

3. SYNOPSES ARE A FENCE, NOT A SOURCE. Each film's synopsis is supplied so you
   know what the film is and cannot invent — it is not material to paraphrase. Do
   not summarise plots. What you write is about the work: what it is aimed at,
   what recurs across it, what the new release looks like against what came
   before.

4. THE NEW RELEASE IS THE OCCASION. The piece exists because it just came out.
   Lead from there. Do not pretend to survey a career from nowhere.

5. Reproduce \`rank\` and \`title\` exactly as supplied. Never reorder, renumber,
   rename, add or drop a film.

6. Notes are 20-35 words. One idea each, stated with conviction. Every note must
   open with a different word.

Voice: assured, specific, unfussy. No hype adjectives (visionary, masterful,
singular, must-watch). No rhetorical questions. No "arguably". No "a testament
to", "cements his status as", or similar filler scaffolding.`

const SPOTLIGHT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'Polished headline naming the subject. No colon-subtitle cliches.' },
    dek: { type: Type.STRING, description: 'One or two sentences framing why this person, now. 25-40 words.' },
    body: {
      type: Type.STRING,
      description:
        'Two or three short paragraphs, markdown, separated by blank lines. 70-140 words total. No headings.',
    },
    works: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rank: { type: Type.INTEGER },
          title: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ['rank', 'title', 'note'],
        propertyOrdering: ['rank', 'title', 'note'],
      },
    },
  },
  required: ['headline', 'dek', 'body', 'works'],
  propertyOrdering: ['headline', 'dek', 'body', 'works'],
}

type GeneratedSpotlight = {
  headline: string
  dek: string
  body: string
  works: { rank: number; title: string; note: string }[]
}

type Subject = {
  personId: number
  name: string
  profilePath: string | null
  /** The film whose release triggered this piece. Always rank 1. */
  trigger: TmdbDiscoverResult
  priorWorks: TmdbDiscoverResult[]
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildFactsPrompt(subject: Subject, works: TmdbDiscoverResult[]) {
  const lines = works.map((w, i) => {
    const parts = [
      `${i + 1}. ${w.title}`,
      w.release_year ? `year: ${w.release_year}` : null,
      w.vote_average != null ? `audience score: ${w.vote_average}/10` : null,
      i === 0 ? 'THIS IS THE NEW RELEASE — the occasion for the piece' : null,
      w.overview ? `synopsis (fence, do not paraphrase): ${w.overview}` : null,
    ].filter(Boolean)
    return parts.join('\n   ')
  })

  return [
    `Subject: ${subject.name}`,
    `Role: Director`,
    '',
    'Films, in the order they must appear. Rank 1 is the new release; the rest are',
    'earlier films they directed, best-scored first.',
    '',
    lines.join('\n\n'),
    '',
    `Write ${works.length} notes, one per film, at the ranks given.`,
  ].join('\n')
}

/**
 * Verify the model returned exactly the films it was given, at the ranks it was
 * given — the same contract rankings enforces, and for the same reason: notes
 * are bound to a movie_id by rank under spotlight_works' UNIQUE(article_id,
 * rank), so a shifted note attaches to the wrong film and renders publicly.
 */
function assertFaithful(generated: GeneratedSpotlight, works: TmdbDiscoverResult[]) {
  if (works.length === 0 || generated.works.length === 0) {
    throw new Error('Refusing to build a spotlight with no works.')
  }
  if (generated.works.length !== works.length) {
    throw new Error(`Model returned ${generated.works.length} works, expected ${works.length}.`)
  }

  const expected = new Map(works.map((w, i) => [i + 1, w.title]))
  for (const item of generated.works) {
    const want = expected.get(item.rank)
    if (want === undefined) throw new Error(`Model invented rank ${item.rank}.`)
    if (item.title.trim() !== want) {
      throw new Error(`Rank ${item.rank} should be "${want}" but the model returned "${item.title}".`)
    }
    const words = item.note.trim().split(/\s+/).filter(Boolean).length
    if (words < MIN_NOTE_WORDS || words > MAX_NOTE_WORDS) {
      throw new Error(`Rank ${item.rank} note is ${words} words, outside ${MIN_NOTE_WORDS}-${MAX_NOTE_WORDS}.`)
    }
  }

  const ranks = new Set(generated.works.map(w => w.rank))
  if (ranks.size !== generated.works.length) throw new Error('Model returned duplicate ranks.')

  const bodyWords = generated.body.trim().split(/\s+/).filter(Boolean).length
  if (bodyWords < MIN_BODY_WORDS || bodyWords > MAX_BODY_WORDS) {
    throw new Error(`Body is ${bodyWords} words, outside ${MIN_BODY_WORDS}-${MAX_BODY_WORDS}.`)
  }
}

/**
 * Find a director whose new release justifies a profile.
 *
 * Walks candidates in popularity order and takes the first that clears every
 * bar, rather than scoring them: the trigger is the editorial justification, so
 * the most prominent new release that yields a usable piece is the right answer.
 */
async function pickSubject(
  supabase: ReturnType<typeof createAdminClient>,
  windowDays: number
): Promise<Subject> {
  const today = new Date()
  const from = new Date(today)
  from.setUTCDate(from.getUTCDate() - windowDays)

  const releases = await discoverTmdbMovies({
    'primary_release_date.gte': ymd(from),
    'primary_release_date.lte': ymd(today),
    sort_by: 'popularity.desc',
    language: 'en-US',
  })

  const skipped: string[] = []

  for (const film of releases.slice(0, MAX_CANDIDATES)) {
    const details = await getTmdbMovieDetails(film.tmdb_id)

    // profile_path comes free here: getTmdbMovieDetails already appends credits,
    // so no separate /person fetch is needed for the portrait.
    const director = (details?.credits?.crew ?? []).find((c: any) => c.job === 'Director')
    if (!director) {
      skipped.push(`${film.title}: no director credited`)
      continue
    }
    if (!director.profile_path) {
      // subject_photo_url drives the hero portrait; without it the spotlight
      // falls back to a film backdrop and stops being about a person.
      skipped.push(`${film.title}: ${director.name} has no portrait`)
      continue
    }

    const signature = spotlightSignature(director.id)
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('query_signature', signature)
      .limit(1)
      .maybeSingle()
    if (existing) {
      // Checked before the Gemini call, not after — query_signature has no
      // uniqueness constraint, so nothing downstream would catch a repeat.
      skipped.push(`${film.title}: ${director.name} already has a spotlight`)
      continue
    }

    const directed = await getTmdbPersonDirectedMovies(director.id, PRIOR_VOTE_FLOOR)
    const priorWorks = directed.filter(m => m.tmdb_id !== film.tmdb_id)
    if (priorWorks.length < MIN_PRIOR_WORKS) {
      skipped.push(`${film.title}: ${director.name} has ${priorWorks.length} prior works`)
      continue
    }

    return {
      personId: director.id,
      name: director.name,
      profilePath: director.profile_path,
      trigger: film,
      priorWorks,
    }
  }

  throw new NoSpotlightSubjectError(
    `No qualifying subject in the last ${windowDays} days. Considered ${Math.min(
      releases.length,
      MAX_CANDIDATES
    )}: ${skipped.join('; ') || 'no releases returned'}.`
  )
}

export type GenerateSpotlightResult = {
  articleId: string
  slug: string
  title: string
  subjectName: string
  model: string
  usage: { input: number; output: number; thoughts: number; total: number }
  workCount: number
  triggerTitle: string
}

export async function generateSpotlightDraft(
  opts: { windowDays?: number } = {}
): Promise<GenerateSpotlightResult> {
  const supabase = createAdminClient()
  const subject = await pickSubject(supabase, opts.windowDays ?? WINDOW_DAYS)

  // Trigger film first: it is the occasion, and it would otherwise be filtered
  // out of the works list entirely — a film released days ago has not
  // accumulated enough votes to clear PRIOR_VOTE_FLOOR.
  const works = [subject.trigger, ...subject.priorWorks].slice(0, MAX_WORKS)

  // Upsert the films before the works rows: spotlight_works.movie_id FKs to
  // movies(id), so a work pointing at an unsaved film cannot be inserted.
  // Sequential rather than parallel — six fetches is quick, and firing them at
  // once is what produced repeated ECONNRESETs in the rankings pipeline.
  const movieIds: (string | null)[] = []
  let triggerBackdrop: string | null = null

  for (const [index, work] of works.entries()) {
    const details = await getTmdbMovieDetails(work.tmdb_id)
    const parsed = parseTmdbToInternalMovie(details)
    if (!parsed) throw new Error(`TMDB returned an unusable record for "${work.title}" (${work.tmdb_id}).`)
    if (index === 0) triggerBackdrop = parsed.backdrop_url ?? null

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

    if (error) throw new Error(`Movie upsert failed for "${parsed.title}": ${error.message}`)
    movieIds.push(data.id)
  }

  const { data: generated, model, usage } = await generateJson<GeneratedSpotlight>({
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: buildFactsPrompt(subject, works),
    schema: SPOTLIGHT_SCHEMA,
  })

  assertFaithful(generated, works)

  const authorId = await resolveAuthorId(supabase)
  const slug = await uniqueSlug(supabase, slugify(generated.headline || subject.name))

  const { data: article, error: articleError } = await supabase
    .from('articles')
    .insert({
      title: generated.headline || subject.name,
      slug,
      type: 'spotlight',
      // Never 'published'. See the module header.
      status: 'draft',
      excerpt: generated.dek,
      content: generated.body,
      author_id: authorId,
      subject_name: subject.name,
      subject_role: 'Director',
      subject_photo_url: `https://image.tmdb.org/t/p/w500${subject.profilePath}`,
      // The hero prefers subject_photo_url and falls back to this, so a
      // landscape backdrop is the right fallback for a full-bleed block.
      cover_image_url: triggerBackdrop ?? subject.trigger.poster_url ?? null,
      seo_title: (generated.headline || subject.name).slice(0, 60),
      seo_description: generated.dek.slice(0, 155),
      query_signature: spotlightSignature(subject.personId),
    })
    .select('id, slug, title')
    .single()

  if (articleError) throw new Error(`Article insert failed: ${articleError.message}`)

  const { error: worksError } = await supabase.from('spotlight_works').insert(
    generated.works
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map(item => ({
        article_id: article.id,
        rank: item.rank,
        movie_id: movieIds[item.rank - 1] ?? null,
        custom_title: item.title,
        note: item.note,
      }))
  )

  if (worksError) {
    // An empty Notable Works grid is worse than no article, the same reason the
    // rankings pipeline rolls back on a failed items insert.
    await supabase.from('articles').delete().eq('id', article.id)
    throw new Error(`spotlight_works insert failed, article rolled back: ${worksError.message}`)
  }

  return {
    articleId: article.id,
    slug: article.slug,
    title: article.title,
    subjectName: subject.name,
    model,
    usage,
    workCount: generated.works.length,
    triggerTitle: subject.trigger.title,
  }
}
