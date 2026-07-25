'use client'

import { useState } from 'react'
import { Play, Check } from 'lucide-react'
import { triggerRunner } from '@/lib/actions/jobs'

export default function TriggerRunnerButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleClick = async () => {
    setState('loading')
    try {
      await triggerRunner()
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className="brutal-button px-5 py-3 flex items-center justify-center gap-2 text-xs bg-primary disabled:opacity-60"
    >
      {state === 'loading' && <span className="animate-spin border-2 border-foreground border-t-transparent rounded-full w-4 h-4" />}
      {state === 'done' && <Check size={16} />}
      {state === 'idle' && <Play size={16} />}
      {state === 'loading' ? 'Queuing…' : state === 'done' ? 'Queued!' : 'Trigger Runner'}
    </button>
  )
}
