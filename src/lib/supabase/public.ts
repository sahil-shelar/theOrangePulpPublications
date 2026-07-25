import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Singleton public client — no cookies, safe inside unstable_cache callbacks
let _client: ReturnType<typeof createClient<Database>> | null = null

export function createPublicClient() {
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
  }
  return _client
}
