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
  getTmdbPersonDetails,
  getTmdbPersonDirectedMovies,
  parseTmdbToInternalMovie,
  searchTmdbPerson,
  type TmdbDiscoverResult,
} from '@/lib/services/tmdb'
import { createAdminClient } from '@/lib/supabase/admin'
import { currentDataOrigin } from '@/lib/data-origin'
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

/**
 * The editor asked for a specific person and the request cannot be honoured.
 *
 * Distinct from NoSpotlightSubjectError on purpose: that one means "nothing in
 * this week's releases qualifies, and that is a normal outcome, try again
 * later" — the cron route logs it at info and the dashboard shows it as
 * information, not a failure (see route.ts and generate.ts). Naming a person is
 * a direct request, so "Nolan already has a spotlight" or "no directed release
 * found" needs to read as a targeted error the editor can act on, not as a
 * quiet week.
 */
export class SpotlightSubjectUnavailableError extends Error {}

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
  /* Structured fields only, rendered as data in the subject panel. The prompt
     never sees them, and TMDB's free-text biography is never fetched. */
  birthday: string | null
  placeOfBirth: string | null
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

    // One extra fetch, only for the candidate that already cleared every bar.
    // Failing here must not lose the subject: these fields are decorative in the
    // panel, so a null person record degrades to name + role.
    const person = await getTmdbPersonDetails(director.id).catch(() => null)

    return {
      personId: director.id,
      name: director.name,
      profilePath: director.profile_path,
      birthday: person?.birthday ?? null,
      placeOfBirth: person?.place_of_birth ?? null,
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

/**
 * Build a Subject for a director an editor named directly, rather than one the
 * release window picked.
 *
 * The module header's argument for auto-selection still holds — "why this
 * person, why now" cannot be invented — but an editor choosing to write about
 * someone IS an editorial answer to that question. It just means the piece
 * cannot lean on "just came out": WINDOW_DAYS is not applied here, so the
 * trigger is whichever of their directed films released most recently, full
 * stop, not "most recently within 10 days". SYSTEM_INSTRUCTION rule 4 (`THE
 * NEW RELEASE IS THE OCCASION`) still gets a real, if not brand-new, film to
 * lead from — never a synthetic "career overview" with nothing to hang the
 * opening paragraph on.
 *
 * Only directors are supported. An actor's spotlight would need a differently
 * shaped subject (cast credits instead of directed ones, no meaningful
 * "directed since" framing, and SYSTEM_INSTRUCTION rule 2 — "NO BIOGRAPHY...
 * write about the work" — was written assuming the work is a filmography of
 * films the person made, not appeared in). Building that properly is a
 * separate feature, not a parameter on this one.
 */
async function pickNamedSubject(
  supabase: ReturnType<typeof createAdminClient>,
  personName: string
): Promise<Subject> {
  // Ranked scoring, not results[0] — see searchTmdbPerson. Directing is
  // preferred so a same-named actor does not win a request meant for a
  // director.
  const person = await searchTmdbPerson(personName, { preferDepartment: 'Directing' })
  if (!person) {
    throw new SpotlightSubjectUnavailableError(`No TMDB person found for "${personName}".`)
  }
  // Deliberately NOT gated on knownForDepartment here. That field is TMDB's
  // "where do they have the most credits" heuristic, not "have they directed
  // anything" — it categorises plenty of working directors (Greta Gerwig,
  // Ben Affleck, Bradley Cooper) as Acting because that side of their career is
  // larger, which would have wrongly refused every one of them. The real check
  // is factual: does getTmdbPersonDirectedMovies below find any directed,
  // released film. searchTmdbPerson still WEIGHTS Directing when disambiguating
  // between several people sharing a name — that scoring bias just is not
  // treated as a hard requirement once a single person has been resolved.

  const signature = spotlightSignature(person.id)
  const { data: existing } = await supabase
    .from('articles')
    .select('id, slug')
    .eq('query_signature', signature)
    .limit(1)
    .maybeSingle()
  if (existing) {
    throw new SpotlightSubjectUnavailableError(
      `${person.name} already has a spotlight (${existing.slug}).`
    )
  }

  // minVotes 0: a genuinely new release may not have accumulated any votes yet,
  // and the trigger is chosen by recency here, not by audience signal — unlike
  // priorWorks below, which still needs the vote floor to keep the Notable
  // Works grid from filling with untracked entries.
  const allDirected = await getTmdbPersonDirectedMovies(person.id, 0)
  const dated = allDirected
    .filter(m => m.release_date && m.release_date <= ymd(new Date()))
    .sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))

  const trigger = dated[0]
  if (!trigger) {
    throw new SpotlightSubjectUnavailableError(
      `No released, directed film found for ${person.name} on TMDB.`
    )
  }

  const directed = await getTmdbPersonDirectedMovies(person.id, PRIOR_VOTE_FLOOR)
  const priorWorks = directed.filter(m => m.tmdb_id !== trigger.tmdb_id)
  if (priorWorks.length < MIN_PRIOR_WORKS) {
    throw new SpotlightSubjectUnavailableError(
      `${person.name} has only ${priorWorks.length} prior directed film(s) with enough votes ` +
      `(need ${MIN_PRIOR_WORKS}) — too few to fill the Notable Works grid.`
    )
  }

  // Same reasoning as pickSubject: profile_path drives the hero portrait, and a
  // director with no photo degrades the piece to being about a film instead of
  // a person. Read off the trigger film's credits rather than a second search,
  // matching pickSubject's approach.
  const details = await getTmdbMovieDetails(trigger.tmdb_id)
  const director = (details?.credits?.crew ?? []).find(
    (c: any) => c.job === 'Director' && c.id === person.id
  )
  if (!director?.profile_path) {
    throw new SpotlightSubjectUnavailableError(
      `${person.name} has no portrait on TMDB — cannot build the subject header.`
    )
  }

  const info = await getTmdbPersonDetails(person.id).catch(() => null)

  return {
    personId: person.id,
    name: person.name,
    profilePath: director.profile_path,
    birthday: info?.birthday ?? null,
    placeOfBirth: info?.place_of_birth ?? null,
    trigger,
    priorWorks,
  }
}

export type GenerateSpotlightResult = {
  articleId: string
  slug: string
  title: string
  subjectName: string
  hasBio: boolean
  model: string
  usage: { input: number; output: number; thoughts: number; total: number }
  workCount: number
  triggerTitle: string
}

export async function generateSpotlightDraft(
  opts: { windowDays?: number; personName?: string } = {}
): Promise<GenerateSpotlightResult> {
  const supabase = createAdminClient()
  const personName = opts.personName?.trim()

  // Two ways to reach a Subject, same shape either way: the automatic path
  // decides who AND why ("this director, because their film just came out");
  // the named path takes who as given and finds a why in their own filmography
  // (their most recent directed release, regardless of window). Everything
  // from here down — upsert, prompt, validate, insert, rollback — is identical
  // for both, same as rankings' fixed-template vs free-text convergence.
  const subject = personName
    ? await pickNamedSubject(supabase, personName)
    : await pickSubject(supabase, opts.windowDays ?? WINDOW_DAYS)

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
      subject_birthday: subject.birthday,
      subject_birthplace: subject.placeOfBirth,
      // The hero prefers subject_photo_url and falls back to this, so a
      // landscape backdrop is the right fallback for a full-bleed block.
      cover_image_url: triggerBackdrop ?? subject.trigger.poster_url ?? null,
      seo_title: (generated.headline || subject.name).slice(0, 60),
      seo_description: generated.dek.slice(0, 155),
      query_signature: spotlightSignature(subject.personId),
      // Same rule as rankings: tagged with the environment that generated it.
      origin: currentDataOrigin(),
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
    hasBio: Boolean(subject.birthday || subject.placeOfBirth),
    model,
    usage,
    workCount: generated.works.length,
    triggerTitle: subject.trigger.title,
  }
}
