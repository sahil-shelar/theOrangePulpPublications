import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// React cache() deduplicates within a single render tree.
// layout.tsx + any dashboard child that needs the user share one auth round-trip.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
