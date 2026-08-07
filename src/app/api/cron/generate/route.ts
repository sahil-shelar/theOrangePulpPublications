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
import { generateRankingDraft, generateRankingFromResolved } from '@/lib/generation/rankings'
import { isTemplateId, type TemplateId, type TemplateParams } from '@/lib/generation/templates'
import { resolveTopic, UnsupportedTopicError } from '@/lib/generation/intent'
import { generateSpotlightDraft, NoSpotlightSubjectError } from '@/lib/generation/spotlights'

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

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_type: 'generate_spotlight',
        payload: { windowDays: windowDays ?? null },
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
      const result = await generateSpotlightDraft(windowDays ? { windowDays } : {})

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
      // "Nobody qualified this week" is a normal outcome, not a fault, so it is
      // logged at info and reported 422 — the same split the topic parser uses.
      // Marking it failed would make a quiet week look like a broken cron.
      const noSubject = err instanceof NoSpotlightSubjectError

      await supabase.from('job_logs').insert({
        job_id: job.id,
        level: noSubject ? 'info' : 'error',
        message: noSubject ? `No spotlight subject: ${message}` : message,
        metadata: { noSubject },
      })
      await supabase
        .from('jobs')
        .update(
          noSubject
            ? { status: 'completed', completed_at: new Date().toISOString() }
            : { status: 'failed', failed_reason: message, completed_at: new Date().toISOString() }
        )
        .eq('id', job.id)

      return NextResponse.json({ ok: false, noSubject, jobId: job.id, error: message }, { status: noSubject ? 422 : 500 })
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
    const result = await generateRankingDraft(template, params)

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
