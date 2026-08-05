'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSiteSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error("Forbidden: Only Admins can update settings")
  }

  // One row per setting — site_settings is keyed on `key`, with the value in a
  // JSONB column. The previous version upserted { id: 1, site_name, ... },
  // which matched neither the column set nor the uuid primary key, so saving
  // settings always failed.
  const rows = [
    { key: 'site_name', value: (formData.get('site_name') as string) ?? '' },
    { key: 'site_description', value: (formData.get('site_description') as string) ?? '' },
    { key: 'maintenance_mode', value: formData.get('maintenance_mode') === 'on' },
  ]

  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })
  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return { success: true }
}
