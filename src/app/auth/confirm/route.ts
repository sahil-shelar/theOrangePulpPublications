import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    console.error('[auth/confirm] exchangeCodeForSession error:', error?.message, error?.status)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'Invalid or expired link')}`)
  }

  console.error('[auth/confirm] no code in URL, params:', Object.fromEntries(searchParams))
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No code in link — try again')}`)
}
