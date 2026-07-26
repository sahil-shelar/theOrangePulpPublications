'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AuthConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function verify() {
      // PKCE flow: ?code=xxx in query params
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/reset-password')
          return
        }
        setStatus('error')
        setErrorMsg(error.message)
        return
      }

      // Implicit flow: #access_token=xxx in URL hash
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (!error) {
            router.replace('/reset-password')
            return
          }
          setStatus('error')
          setErrorMsg(error.message)
          return
        }
      }

      setStatus('error')
      setErrorMsg('No authentication token found in link.')
    }

    verify()
  }, [router, searchParams])

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-black uppercase tracking-widest text-sm text-foreground">Verifying...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
      <p className="font-black uppercase tracking-widest text-sm text-foreground text-center">
        Link invalid or expired
      </p>
      {errorMsg && (
        <p className="text-xs uppercase tracking-widest text-foreground/50 text-center max-w-sm">{errorMsg}</p>
      )}
      <p className="text-xs uppercase tracking-widest text-foreground/50 text-center">
        Contact an admin to send a new invite
      </p>
      <Link href="/login" className="text-xs font-black uppercase tracking-widest text-foreground underline underline-offset-4">
        Back to Login
      </Link>
    </div>
  )
}
