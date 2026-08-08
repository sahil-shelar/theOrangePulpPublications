'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { JOB_PRIORITY } from '@/lib/jobs/types'
import { generateRankingFromResolved } from '@/lib/generation/rankings'
import { resolveTopic, UnsupportedTopicError } from '@/lib/generation/intent'
import { generateSpotlightDraft, NoSpotlightSubjectError, SpotlightSubjectUnavailableError } from '@/lib/generation/spotlights'

const MAX_TOPIC_LENGTH = 200

export type GenerateRankingState =
  | { status: 'ok'; articleId: string; slug: string; title: string; itemCount: number; model: string; queryDescription: string; angle: string; totalTokens: number; excludedCount: number; part: number }
  /** The topic could not be turned into a query. Not an error the editor caused. */
  | { status: 'unsupported'; reason: string }
  | { status: 'error'; message: string }

export async function generateRankingFromTopic(topic: string): Promise<GenerateRankingState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'You must be signed in.' }

  const trimmed = topic.trim()
  if (!trimmed) return { status: 'error', message: 'Enter a topic.' }
  if (trimmed.length > MAX_TOPIC_LENGTH) {
    return { status: 'error', message: `Keep the topic under ${MAX_TOPIC_LENGTH} characters.` }
  }

  // Audit row first: job_logs.job_id is NOT NULL and FKs to jobs(id), so a run
  // needs a jobs row before anything can be recorded against it.
  const admin = createAdminClient()
  const { data: job } = await admin
    .from('jobs')
    .insert({
      job_type: 'generate_ranking',
      payload: { topic: trimmed, source: 'dashboard' },
      status: 'running',
      priority: JOB_PRIORITY.high,
      started_at: new Date().toISOString(),
      created_by: user.id,
      attempts: 1,
    })
    .select('id')
    .single()

  async function finish(level: 'info' | 'error', message: string, metadata: Record<string, unknown>) {
    if (!job) return
    // job_logs.metadata is JSONB; the generated Json type rejects `unknown` values,
    // and a round-trip is cheaper than hand-typing every payload shape.
    await admin
      .from('job_logs')
      .insert({ job_id: job.id, level, message, metadata: JSON.parse(JSON.stringify(metadata)) })
    await admin
      .from('jobs')
      .update({
        status: level === 'info' ? 'completed' : 'failed',
        failed_reason: level === 'error' ? message : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
  }

  try {
    const { resolved, queryDescription, querySignature, excludedCount, intent } = await resolveTopic(trimmed)
    const result = await generateRankingFromResolved(resolved)

    await finish('info', `Generated draft "${result.title}" (${result.itemCount} items) with ${result.model}`, {
      ...result, topic: trimmed, queryDescription, querySignature, excludedCount,
    })

    revalidatePath('/dashboard/articles')
    revalidatePath('/dashboard/jobs')

    return {
      status: 'ok',
      articleId: result.articleId,
      slug: result.slug,
      title: result.title,
      itemCount: result.itemCount,
      model: result.model,
      queryDescription,
      excludedCount,
      part: intent.part,
      angle: intent.angle,
      totalTokens: result.usage.total,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (err instanceof UnsupportedTopicError) {
      // Recorded as a warning-level outcome rather than a crash: refusing an
      // unqueryable topic is the guardrail working.
      await finish('error', `Unsupported topic: ${message}`, { topic: trimmed, unsupported: true })
      revalidatePath('/dashboard/jobs')
      return { status: 'unsupported', reason: message }
    }

    await finish('error', message, { topic: trimmed })
    revalidatePath('/dashboard/jobs')
    return { status: 'error', message }
  }
}

export type GenerateSpotlightState =
  | { status: 'ok'; articleId: string; slug: string; title: string; subjectName: string; triggerTitle: string; workCount: number; model: string; totalTokens: number }
  /** Nobody qualified in the release window. A normal outcome, not a fault —
   *  the same distinction the cron route draws. Surfaced separately so the UI
   *  can say "nothing to write this week" rather than showing a red error. */
  | { status: 'no-subject'; reason: string }
  /** A NAMED person was requested and cannot be used — already covered, not a
   *  director, no recent release, too few prior films, no portrait. Distinct
   *  from 'no-subject': this is a direct request, so it reads as a targeted
   *  problem the editor can fix, not a quiet week. */
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; message: string }

/**
 * Generate a Spotlight draft on demand.
 *
 * Until now this only ran from the Thursday cron, so an editor could not produce
 * one at all. Two ways to choose the subject:
 *
 *  - Leave `personName` empty: the pipeline picks a director from films released
 *    in the last `windowDays`, because "why this person, why now" is exactly
 *    what a spotlight cannot invent on its own.
 *  - Name a director: the editor IS the answer to "why now" by choosing to
 *    write about them; the trigger becomes their most recent directed release,
 *    regardless of window. See pickNamedSubject's header for why this only
 *    covers directors, not actors.
 */
export async function generateSpotlightNow(
  opts: { windowDays?: number; personName?: string } = {}
): Promise<GenerateSpotlightState> {
  const { windowDays, personName } = opts
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'You must be signed in.' }

  if (windowDays !== undefined && (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 60)) {
    return { status: 'error', message: 'Window must be a whole number of days between 1 and 60.' }
  }
  if (personName !== undefined && personName.trim().length > 200) {
    return { status: 'error', message: 'Director name is too long.' }
  }

  const admin = createAdminClient()
  const { data: job } = await admin
    .from('jobs')
    .insert({
      job_type: 'generate_spotlight',
      payload: { windowDays: windowDays ?? null, personName: personName?.trim() || null, source: 'dashboard' },
      status: 'running',
      priority: JOB_PRIORITY.high,
      started_at: new Date().toISOString(),
      created_by: user.id,
      attempts: 1,
    })
    .select('id')
    .single()

  async function finish(level: 'info' | 'error', message: string, metadata: Record<string, unknown>) {
    if (!job) return
    await admin
      .from('job_logs')
      .insert({ job_id: job.id, level, message, metadata: JSON.parse(JSON.stringify(metadata)) })
    await admin
      .from('jobs')
      .update({
        status: level === 'info' ? 'completed' : 'failed',
        failed_reason: level === 'error' ? message : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
  }

  try {
    const result = await generateSpotlightDraft({
      windowDays,
      personName: personName?.trim() || undefined,
    })

    await finish('info', `Generated spotlight "${result.title}" on ${result.subjectName} (${result.workCount} works) with ${result.model}`, { ...result })

    revalidatePath('/dashboard/articles')
    revalidatePath('/dashboard/jobs')

    return {
      status: 'ok',
      articleId: result.articleId,
      slug: result.slug,
      title: result.title,
      subjectName: result.subjectName,
      triggerTitle: result.triggerTitle,
      workCount: result.workCount,
      model: result.model,
      totalTokens: result.usage.total,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (err instanceof NoSpotlightSubjectError) {
      // Logged at info and the job marked completed, matching the cron route:
      // a quiet week is not a broken pipeline.
      await finish('info', `No spotlight subject: ${message}`, { noSubject: true })
      revalidatePath('/dashboard/jobs')
      return { status: 'no-subject', reason: message }
    }

    if (err instanceof SpotlightSubjectUnavailableError) {
      // A direct request that cannot be honoured is still not an infrastructure
      // fault — logged at info, same as an unsupported ranking topic.
      await finish('info', `Requested subject unavailable: ${message}`, { unavailable: true })
      revalidatePath('/dashboard/jobs')
      return { status: 'unavailable', reason: message }
    }

    await finish('error', message, {})
    revalidatePath('/dashboard/jobs')
    return { status: 'error', message }
  }
}
