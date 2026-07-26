'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Verifying...')

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        if (session) {
          router.replace('/reset-password')
        }
      }
    })

    // Also check if session already exists (hash processed synchronously)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/reset-password')
      } else {
        // Give onAuthStateChange a moment to process the hash
        setTimeout(() => {
          setStatus('Link invalid or expired. Please request a new invite.')
        }, 3000)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-foreground font-black uppercase tracking-widest text-sm">{status}</p>
    </div>
  )
}
