import { createClient } from '@/lib/supabase/server'
import { JobType, JobPriority, JobStatus, JOB_PRIORITY } from './types'

export async function dispatchJob(
  jobType: JobType,
  payload: Record<string, any> = {},
  options?: {
    priority?: JobPriority
    scheduledAt?: Date
    createdBy?: string
  }
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      job_type: jobType,
      payload,
      status: 'pending' as JobStatus,
      priority: JOB_PRIORITY[options?.priority ?? 'normal'],
      scheduled_at: options?.scheduledAt ? options.scheduledAt.toISOString() : new Date().toISOString(),
      created_by: options?.createdBy,
      attempts: 0
    })
    .select()
    .single()

  if (error) {
    console.error(`[JobEngine] Failed to dispatch ${jobType}:`, error.message)
    throw new Error('Job dispatch failed')
  }

  // If immediate (no scheduledAt or in the past), we could eagerly trigger the runner via fetch(/api/cron/process) here.
  // For Vercel/Next.js, background jobs run via cron route handlers.

  return data
}

export async function logJob(jobId: string, level: 'info' | 'warning' | 'error', message: string, metadata?: any) {
  const supabase = await createClient()
  await supabase.from('job_logs').insert({
    job_id: jobId,
    level,
    message,
    metadata
  })
}

// ---------------------------------------------------------------------------
// JOB RUNNER
//
// NOTHING CALLS processJobs. There is no /api/cron/process route in this repo
// and no entry in vercel.json's crons block for one, so rows inserted by
// dispatchJob or by the dashboard's "Queue Job" button sit at `pending`
// indefinitely. Adding that route is what turns this queue on.
//
// The two generation pipelines do NOT go through here: /api/cron/generate and
// the generateRankingFromTopic server action write their own `jobs` rows and run
// the work inline, which is why generated drafts appear despite the above.
// ---------------------------------------------------------------------------

export async function processJobs(limit = 10) {
  const supabase = await createClient()

  // 1. Fetch pending jobs that are due
  const { data: pendingJobs, error } = await supabase
    .from('jobs')
    .select('*')
    .in('status', ['pending', 'retrying'])
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: false }) // Assuming enum maps to alphabetical logic, but in reality we map critical > high > normal > low. Or we sort by scheduled_at.
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error || !pendingJobs || pendingJobs.length === 0) return 0;

  // 2. Process each job
  for (const job of pendingJobs) {
    // attempts is nullable in the schema — rows inserted without it are null.
    const attempt = (job.attempts ?? 0) + 1

    // Lock the job
    await supabase.from('jobs').update({ status: 'running', started_at: new Date().toISOString(), attempts: attempt }).eq('id', job.id)
    await logJob(job.id, 'info', `Job started (Attempt ${attempt})`)

    try {
      // Execute Domain Logic based on job.job_type
      await executeJobLogic(job.job_type as JobType, job.payload)

      // Mark Completed
      await supabase.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id)
      await logJob(job.id, 'info', `Job completed successfully`)

    } catch (e: any) {
      // Mark Failed
      const maxAttempts = 3;
      const status = attempt >= maxAttempts ? 'failed' : 'retrying'
      
      await supabase.from('jobs').update({ 
        status, 
        failed_reason: e.message || 'Unknown error' 
      }).eq('id', job.id)
      
      await logJob(job.id, 'error', `Job failed: ${e.message}`)
    }
  }

  return pendingJobs.length
}

/**
 * Centralised router for background processes.
 *
 * Every branch here is still a stub. That is fine in itself — what was not fine
 * is that the stubs returned normally, so processJobs marked the job
 * `completed`. The jobs dashboard then showed a green tick for a TMDB sync that
 * never fetched anything and a trending recalculation that never touched a
 * score, which is worse than showing nothing: it is a wrong answer to "did this
 * run?".
 *
 * Unimplemented work now throws. The job lands in `failed` with the reason in
 * `failed_reason`, which is the truth until an executor is written. Implementing
 * one means replacing its throw with the real work — nothing else changes.
 */
class JobNotImplementedError extends Error {
  constructor(type: JobType, note: string) {
    super(`No executor bound for "${type}". ${note}`)
    this.name = 'JobNotImplementedError'
  }
}

async function executeJobLogic(type: JobType, payload: any) {
  switch (type) {
    case 'publish_article':
      throw new JobNotImplementedError(type, `Would publish article ${payload?.article_id}.`)
    case 'recalculate_trending':
      // Intended: update the `trending_score` column in the database, e.g.
      // (views * 0.5) + (shares * 1.2) / hoursSincePublished.
      throw new JobNotImplementedError(type, 'Trending scores are not recalculated by any job yet.')
    case 'recalculate_recommendations':
      throw new JobNotImplementedError(type, 'Recommendation graphs are computed on read, not precomputed.')
    case 'tmdb_sync':
      // Intended: select movies not synced in 7 days, map over
      // getTmdbMovieDetails, update metadata.
      throw new JobNotImplementedError(type, 'TMDB sync is not wired up.')
    default:
      throw new JobNotImplementedError(type, 'This job type has no handler at all.')
  }
}
