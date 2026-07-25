import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY! // Or anon key if RLS allows

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false }
})

export const config = {
  movieTargetCount: 500,
  tvTargetCount: 200,
  reviewCount: 120,
  newsCount: 120,
  spotlightCount: 40,
  featureCount: 40,
  rankingCount: 30,
  totalTags: 300,
  authorCount: 15
}
