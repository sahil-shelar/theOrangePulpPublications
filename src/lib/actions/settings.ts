// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSiteSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error("Forbidden: Only Admins can update settings")
  }

  const payload = {
    site_name: formData.get('site_name') as string,
    site_description: formData.get('site_description') as string,
    maintenance_mode: formData.get('maintenance_mode') === 'on'
  }

  // Upsert settings (assuming id 1 is the canonical row)
  const { error } = await supabase.from('site_settings').upsert({ id: 1, ...payload })
  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return { success: true }
}
