'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { JOB_PRIORITY } from '@/lib/jobs/types'

export async function cancelJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') throw new Error("Forbidden")

  await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', jobId)
  revalidatePath('/dashboard/jobs')
}

export async function retryJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') throw new Error("Forbidden")

  await supabase.from('jobs').update({
    status: 'pending',
    attempts: 0,
    scheduled_at: new Date().toISOString()
  }).eq('id', jobId)

  revalidatePath('/dashboard/jobs')
}

export type JobLogRow = {
  id: string
  level: 'info' | 'warning' | 'error'
  message: string
  created_at: string
  metadata: Record<string, unknown> | null
}

/**
 * Read the job_logs rows the generation pipelines write.
 *
 * These have existed since job_logs was added and had no reader: the dashboard's
 * "Logs" button was a styled <button> with no handler, so every generation run's
 * model name, token usage, query description and failure reason was written and
 * then unreachable.
 *
 * Oldest first — a run reads as a sequence, and there are only ever a handful of
 * rows per job.
 */
export async function getJobLogs(jobId: string): Promise<{ logs: JobLogRow[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') throw new Error("Forbidden")

  const { data, error } = await supabase
    .from('job_logs')
    .select('id, level, message, created_at, metadata')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return { logs: [], error: error.message }
  return { logs: (data ?? []) as JobLogRow[] }
}

export async function triggerRunner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') throw new Error("Forbidden")

  await supabase.from('jobs').insert({
    job_type: 'rebuild_cache',
    payload: { triggered_by: 'manual' },
    status: 'pending',
    priority: JOB_PRIORITY.high,
    attempts: 0,
    scheduled_at: new Date().toISOString(),
    created_by: user.id,
  })

  revalidatePath('/dashboard/jobs')
}
