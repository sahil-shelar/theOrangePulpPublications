import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError } from '@/utils/supabase-error'

export async function getMediaFiles(limit = 50) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    handleSupabaseError(error)
    return []
  }
  return data
}
