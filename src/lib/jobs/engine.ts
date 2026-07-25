// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { JobType, JobPriority, JobStatus } from './types'

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
      priority: options?.priority || 'normal',
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
// JOB RUNNER: (Intended to be called by a cron endpoint or Edge Function)
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
    // Lock the job
    await supabase.from('jobs').update({ status: 'running', started_at: new Date().toISOString(), attempts: job.attempts + 1 }).eq('id', job.id)
    await logJob(job.id, 'info', `Job started (Attempt ${job.attempts + 1})`)

    try {
      // Execute Domain Logic based on job.job_type
      await executeJobLogic(job.job_type, job.payload)
      
      // Mark Completed
      await supabase.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id)
      await logJob(job.id, 'info', `Job completed successfully`)

    } catch (e: any) {
      // Mark Failed
      const maxAttempts = 3;
      const status = job.attempts + 1 >= maxAttempts ? 'failed' : 'retrying'
      
      await supabase.from('jobs').update({ 
        status, 
        failed_reason: e.message || 'Unknown error' 
      }).eq('id', job.id)
      
      await logJob(job.id, 'error', `Job failed: ${e.message}`)
    }
  }

  return pendingJobs.length
}

async function executeJobLogic(type: JobType, payload: any) {
  // Centralized Router for background processes
  switch (type) {
    case 'publish_article':
      console.log('Publishing article', payload.article_id)
      break;
    case 'recalculate_trending':
      console.log('Recalculating trending scores across all entities...')
      // Logic: Update the `trending_score` column natively in DB based on math algorithm.
      // E.g., Score = (Views * 0.5) + (Shares * 1.2) / HoursSincePublished
      break;
    case 'recalculate_recommendations':
      console.log('Pre-computing recommendation graphs for cache...')
      break;
    case 'tmdb_sync':
      console.log('Executing TMDb Sync Pipeline...')
      // 1. Fetch movies requiring sync (last updated > 7 days)
      // 2. Map over getTmdbMovieDetails
      // 3. Update movie metadata
      break;
    default:
      console.log(`[JobEngine] No executor bound for ${type}`)
      break;
  }
}
