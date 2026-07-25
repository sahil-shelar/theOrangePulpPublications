// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') throw new Error("Forbidden")

  await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', jobId)
  revalidatePath('/dashboard/jobs')
}

export async function retryJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') throw new Error("Forbidden")

  await supabase.from('jobs').update({
    status: 'pending',
    attempts: 0,
    scheduled_at: new Date().toISOString()
  }).eq('id', jobId)

  revalidatePath('/dashboard/jobs')
}

export async function triggerRunner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') throw new Error("Forbidden")

  await supabase.from('jobs').insert({
    job_type: 'rebuild_cache',
    payload: { triggered_by: 'manual' },
    status: 'pending',
    priority: 'high',
    attempts: 0,
    scheduled_at: new Date().toISOString(),
    created_by: user.id,
  })

  revalidatePath('/dashboard/jobs')
}
