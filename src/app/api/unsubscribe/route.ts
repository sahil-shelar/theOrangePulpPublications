// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.redirect(`${origin}/?unsubscribed=error`)
  }

  const adminClient = createAdminClient()
  await adminClient
    .from('newsletter_subscribers')
    .update({ is_active: false })
    .eq('id', id)

  return NextResponse.redirect(`${origin}/?unsubscribed=true`)
}
