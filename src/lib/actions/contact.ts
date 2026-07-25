// @ts-nocheck
'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function submitContact(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const subject = (formData.get('subject') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!name || !email || !subject || !message) {
    throw new Error('All fields are required')
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('jobs').insert({
    job_type: 'contact_form',
    payload: { name, email, subject, message },
    status: 'pending',
    priority: 'low',
    attempts: 0,
    scheduled_at: new Date().toISOString(),
  })

  if (error) throw new Error('Failed to submit. Please try again.')
}
