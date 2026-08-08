// Scheduled generation: Rankings by default, Spotlights via ?type=spotlight.
//
// AUTH IS NOT OPTIONAL HERE. Without it, anyone who finds this URL can trigger
// unlimited generation against the Gemini key and fill the dashboard with
// drafts. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; every other
// caller is rejected.

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { JOB_PRIORITY } from '@/lib/jobs/types'
import { generateRankingFromResolved } from '@/lib/generation/rankings'
import { isTemplateId, TEMPLATES, type TemplateId, type TemplateParams } from '@/lib/generation/templates'
import { resolveTopic, UnsupportedTopicError } from '@/lib/generation/intent'
import { generateSpotlightDraft, NoSpotlightSubjectError, SpotlightSubjectUnavailableError } from '@/lib/generation/spotlights'

// A run does ~10 TMDB detail fetches plus one Gemini call.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  // Fail closed: an unset secret must not mean "allow everyone".
  if (!secret) return false

  const header = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  // timingSafeEqual throws on length mismatch, so compare lengths first.
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Deterministic weekly rotation. Keyed off the ISO week so repeated firings in
 * the same week pick the same slot (idempotent-ish) and consecutive weeks do not
 * repeat an angle.
 */
const ROTATION: { template: TemplateId; params: TemplateParams }[] = [
  { template: 'best_genre_year', params: { genre: 'thriller', year: new Date().getUTCFullYear() - 1, count: 10 } },
  { template: 'highest_rated_genre_decade', params: { genre: 'science fiction', decade: 1990, count: 10 } },
  { template: 'best_genre_year', params: { genre: 'horror', year: new Date().getUTCFullYear() - 1, count: 10 } },
  { template: 'highest_rated_genre_decade', params: { genre: 'drama', decade: 2000, count: 10 } },
]

function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Manual override for testing a specific angle. Still behind the secret.
  const url = new URL(request.url)
  const kind = url.searchParams.get('type')

  // ── Spotlight ──
  // Shares this route rather than getting its own so it inherits the CRON_SECRET
  // check above; vercel.json points a second schedule at the same path.
  if (kind === 'spotlight') {
    const supabase = createAdminClient()
    const windowRaw = url.searchParams.get('windowDays')
    const windowDays = windowRaw ? Number(windowRaw) : undefined
    if (windowRaw && !Number.isInteger(windowDays)) {
      return NextResponse.json({ error: `"windowDays" must be an integer, got "${windowRaw}".` }, { status: 400 })
    }
    // Manual override for testing a specific director, same idea as the
    // ranking path's ?template=/?person= overrides below. The weekly cron
    // never sends this — the scheduled run always auto-picks.
    const personName = url.searchParams.get('person') ?? undefined

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_type: 'generate_spotlight',
        payload: { windowDays: windowDays ?? null, personName: personName ?? null },
        status: 'running',
        priority: JOB_PRIORITY.normal,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: `Could not create job row: ${jobError?.message}` }, { status: 500 })
    }

    try {
      const result = await generateSpotlightDraft({ windowDays, personName })

      await supabase.from('job_logs').insert({
        job_id: job.id,
        level: 'info',
        message: `Generated spotlight "${result.title}" on ${result.subjectName} (${result.workCount} works) with ${result.model}`,
        metadata: { ...result },
      })
      await supabase.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id)

      return NextResponse.json({ ok: true, jobId: job.id, ...result })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // "Nobody qualified this week" / "that named person isn't available" are
      // both normal outcomes, not faults — logged at info and reported 422,
      // the same split the topic parser uses. Marking either failed would make
      // a quiet week or a bad request look like a broken cron.
      const noSubject = err instanceof NoSpotlightSubjectError
      const unavailable = err instanceof SpotlightSubjectUnavailableError
      const expected = noSubject || unavailable

      await supabase.from('job_logs').insert({
        job_id: job.id,
        level: expected ? 'info' : 'error',
        message: noSubject ? `No spotlight subject: ${message}` : unavailable ? `Requested subject unavailable: ${message}` : message,
        metadata: { noSubject, unavailable },
      })
      await supabase
        .from('jobs')
        .update(
          expected
            ? { status: 'completed', completed_at: new Date().toISOString() }
            : { status: 'failed', failed_reason: message, completed_at: new Date().toISOString() }
        )
        .eq('id', job.id)

      return NextResponse.json({ ok: false, noSubject, unavailable, jobId: job.id, error: message }, { status: expected ? 422 : 500 })
    }
  }

  const overrideTemplate = url.searchParams.get('template')
  const freeTopic = url.searchParams.get('topic')

  // Free-text path — the same parser the dashboard form uses, reachable here so
  // topics can be scripted and regression-tested without a browser session.
  if (freeTopic) {
    const supabase = createAdminClient()
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_type: 'generate_ranking',
        payload: { topic: freeTopic, source: 'cron-topic' },
        status: 'running',
        priority: JOB_PRIORITY.normal,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: `Could not create job row: ${jobError?.message}` }, { status: 500 })
    }

    try {
      const { resolved, queryDescription, querySignature, excludedCount } = await resolveTopic(freeTopic)
      const result = await generateRankingFromResolved(resolved)

      await supabase.from('job_logs').insert({
        job_id: job.id,
        level: 'info',
        message: `Generated draft "${result.title}" (${result.itemCount} items) with ${result.model}`,
        metadata: { ...result, topic: freeTopic, queryDescription, querySignature, excludedCount },
      })
      await supabase.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id)

      return NextResponse.json({ ok: true, jobId: job.id, topic: freeTopic, queryDescription, excludedCount, ...result })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const unsupported = err instanceof UnsupportedTopicError

      await supabase.from('job_logs').insert({
        job_id: job.id,
        level: 'error',
        message: unsupported ? `Unsupported topic: ${message}` : message,
        metadata: { topic: freeTopic, unsupported },
      })
      await supabase
        .from('jobs')
        .update({ status: 'failed', failed_reason: message, completed_at: new Date().toISOString() })
        .eq('id', job.id)

      // 422 for "that topic is not queryable" vs 500 for a genuine fault.
      return NextResponse.json({ ok: false, unsupported, jobId: job.id, error: message }, { status: unsupported ? 422 : 500 })
    }
  }

  let template: TemplateId
  let params: TemplateParams

  if (overrideTemplate) {
    if (!isTemplateId(overrideTemplate)) {
      return NextResponse.json({ error: `Unknown template "${overrideTemplate}".` }, { status: 400 })
    }
    template = overrideTemplate

    // Reject non-numeric input rather than coercing it. `Number('abc')` is NaN,
    // and NaN propagated far enough to save a zero-item article before this
    // guard existed.
    const numeric = (name: string) => {
      const raw = url.searchParams.get(name)
      if (raw === null || raw === '') return { ok: true as const, value: undefined }
      const value = Number(raw)
      if (!Number.isInteger(value)) return { ok: false as const, name, raw }
      return { ok: true as const, value }
    }

    const year = numeric('year')
    const decade = numeric('decade')
    const count = numeric('count')

    for (const field of [year, decade, count]) {
      if (!field.ok) {
        return NextResponse.json(
          { error: `Query param "${field.name}" must be an integer, got "${field.raw}".` },
          { status: 400 }
        )
      }
    }

    params = {
      genre: url.searchParams.get('genre') ?? undefined,
      year: year.ok ? year.value : undefined,
      decade: decade.ok ? decade.value : undefined,
      person: url.searchParams.get('person') ?? undefined,
      count: count.ok ? count.value : undefined,
    }
  } else {
    const slot = ROTATION[isoWeek(new Date()) % ROTATION.length]
    template = slot.template
    params = slot.params
  }

  const supabase = createAdminClient()

  // job_logs.job_id is NOT NULL and FKs to jobs(id), so the run needs a jobs row
  // before anything can be logged against it.
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      job_type: 'generate_ranking',
      payload: { template, params },
      status: 'running',
      priority: JOB_PRIORITY.normal,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: `Could not create job row: ${jobError?.message}` }, { status: 500 })
  }

  try {
    // Resolve the films first so the signature is known BEFORE the Gemini call,
    // then check whether this exact query has already produced an article.
    //
    // The rotation is four slots keyed on the ISO week, so slot N recurs every
    // four weeks with identical parameters and used to spend a full model call
    // reproducing a draft that already existed. query_signature has no
    // uniqueness constraint, so nothing downstream would have caught it — the
    // same reason the spotlight path checks before generating rather than after.
    //
    // Skipping is a normal outcome, not a fault: logged at info, job completed,
    // HTTP 200. `?force=1` bypasses it for testing a specific angle by hand.
    const resolved = await TEMPLATES[template].resolve(params)
    const force = url.searchParams.get('force') === '1'

    if (!force && resolved.signature) {
      const { data: existing } = await supabase
        .from('articles')
        .select('id, slug, title')
        .eq('query_signature', resolved.signature)
        .limit(1)
        .maybeSingle()

      if (existing) {
        const message = `Skipped: "${resolved.title}" matches an existing article (${existing.slug}) with the same query signature.`
        await supabase.from('job_logs').insert({
          job_id: job.id,
          level: 'info',
          message,
          metadata: { skipped: true, template, params, signature: resolved.signature, existingId: existing.id },
        })
        await supabase
          .from('jobs')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', job.id)

        return NextResponse.json({
          ok: true, skipped: true, jobId: job.id,
          reason: message, existingId: existing.id, existingSlug: existing.slug,
        })
      }
    }

    const result = await generateRankingFromResolved(resolved)

    await supabase.from('job_logs').insert({
      job_id: job.id,
      level: 'info',
      message: `Generated draft "${result.title}" (${result.itemCount} items) with ${result.model}`,
      metadata: { ...result, template, params },
    })
    await supabase
      .from('jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', job.id)

    return NextResponse.json({ ok: true, jobId: job.id, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    await supabase.from('job_logs').insert({
      job_id: job.id,
      level: 'error',
      message,
      metadata: { template, params },
    })
    await supabase
      .from('jobs')
      .update({ status: 'failed', failed_reason: message, completed_at: new Date().toISOString() })
      .eq('id', job.id)

    return NextResponse.json({ ok: false, jobId: job.id, error: message }, { status: 500 })
  }
}
