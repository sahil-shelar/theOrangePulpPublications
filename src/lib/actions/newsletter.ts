// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCampaign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') throw new Error('Forbidden: Admin only')

  const payload = {
    subject: formData.get('subject') as string,
    body: formData.get('body') as string,
    status: 'draft',
  }

  const { error } = await supabase.from('newsletter_campaigns').insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/newsletter')
  redirect('/dashboard/newsletter')
}
