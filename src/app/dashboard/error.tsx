'use client'

import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="p-12 max-w-2xl mx-auto flex flex-col items-center gap-6">
      <div className="text-5xl font-black font-heading uppercase text-foreground border-b-[6px] border-foreground pb-2">
        Dashboard Error
      </div>
      <p className="text-foreground/70 font-bold uppercase tracking-widest text-sm text-center">
        {error.message || 'Something went wrong loading this page.'}
      </p>
      <button
        onClick={reset}
        className="brutal-button px-6 py-3 bg-primary font-black uppercase tracking-widest text-sm"
      >
        Try Again
      </button>
    </div>
  )
}
