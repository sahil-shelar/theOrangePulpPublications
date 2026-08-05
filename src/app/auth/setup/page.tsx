'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SetupAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(searchParams.get('error') || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { full_name: name },
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="font-heading text-2xl font-black uppercase tracking-widest text-foreground mb-8 text-center hover:text-primary transition-colors">
        The Orange Pulp
      </Link>

      <div className="w-full max-w-md brutal-card bg-primary p-8 md:p-12">
        <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground mb-2 text-center">
          Set Up Account
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-foreground/70 text-center mb-8">
          You&apos;ve been invited to join the team
        </p>

        {error && (
          <div className="bg-red-500 text-white p-4 font-bold border-[3px] border-foreground text-xs uppercase tracking-widest mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="bg-background/50 border-[3px] border-foreground/30 p-3 font-bold text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground">Full Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Your name"
              className="bg-background border-[3px] border-foreground p-3 font-bold text-sm text-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground">Password</label>
            <input
              type="password"
              name="password"
              minLength={6}
              required
              placeholder="Min. 6 characters"
              className="bg-background border-[3px] border-foreground p-3 font-bold text-sm text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background border-[3px] border-foreground px-4 py-4 text-sm font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#E2BFCA] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
