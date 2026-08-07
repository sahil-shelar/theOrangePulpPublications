'use client'

// On-demand Spotlight generation.
//
// There is no topic box, and that is the design rather than an omission. A
// ranking is justified by its query — "the ten highest grossing films" explains
// itself. A spotlight is not: "why this person, why now" cannot be derived from
// a filmography, so the pipeline picks a director whose film came out inside the
// window instead of letting an editor nominate one. The only control is how far
// back to look.

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, AlertTriangle, Check, CalendarClock, Eye } from 'lucide-react'
import { generateSpotlightNow, type GenerateSpotlightState } from '@/lib/actions/generate'

const DEFAULT_WINDOW = 10

export default function GenerateSpotlightForm() {
  const [windowDays, setWindowDays] = useState(String(DEFAULT_WINDOW))
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<GenerateSpotlightState | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setState(null)
    try {
      setState(await generateSpotlightNow(Number(windowDays)))
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Generation failed.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border-[3px] border-foreground bg-card p-6 space-y-4">
        <div>
          <label htmlFor="windowDays" className="block text-label font-black uppercase tracking-widest text-foreground mb-2">
            Release window
          </label>
          <div className="flex items-center gap-3">
            <input
              id="windowDays"
              type="number"
              min={1}
              max={60}
              value={windowDays}
              onChange={e => setWindowDays(e.target.value)}
              disabled={pending}
              className="w-28 bg-background border-[3px] border-foreground px-4 py-3 font-medium text-foreground disabled:opacity-60"
            />
            <span className="text-meta font-bold uppercase tracking-widest text-muted-foreground">days back</span>
          </div>
          <p className="text-meta font-medium text-muted-foreground mt-2">
            The subject is not chosen on merit — it is whichever director released a film in
            this window and has enough earlier work to fill the Notable Works grid. Widen the
            window if a quiet week turns up nobody.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="brutal-button px-6 py-3 text-xs flex items-center gap-2 disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {pending ? 'Generating…' : 'Generate Spotlight'}
        </button>
      </form>

      {state?.status === 'ok' && (
        <div className="border-[3px] border-foreground bg-secondary shadow-hard-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-label font-black uppercase tracking-widest text-primary-foreground">
            <Check size={16} /> Draft created
          </div>
          <p className="font-heading text-xl font-black uppercase leading-tight text-primary-foreground">{state.title}</p>
          <dl className="text-meta font-bold text-primary-foreground/80 space-y-0.5">
            <div>Subject: {state.subjectName}</div>
            <div>Triggered by: {state.triggerTitle}</div>
            <div>{state.workCount} works · {state.model} · {state.totalTokens.toLocaleString()} tokens</div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href={`/preview/${state.articleId}`} target="_blank" className="inline-flex items-center gap-1.5 border-[2px] border-foreground bg-background px-3 py-2 text-label font-black uppercase tracking-widest hover:bg-primary transition-colors">
              <Eye size={13} /> Preview
            </Link>
            <Link href={`/dashboard/articles/${state.articleId}/edit`} className="inline-flex items-center gap-1.5 border-[2px] border-foreground bg-background px-3 py-2 text-label font-black uppercase tracking-widest hover:bg-primary transition-colors">
              Edit
            </Link>
          </div>
          <p className="text-meta font-bold text-primary-foreground/80 pt-1">
            Saved as a draft, and never published automatically. Read it before you publish —
            the model works from a filmography, and the facts still need a human.
          </p>
        </div>
      )}

      {/* Deliberately NOT styled as an error. Nobody qualifying is a normal
          outcome of a quiet release week, and the cron treats it the same way —
          info level, job completed. Showing red here would train editors to
          read a working pipeline as a broken one. */}
      {state?.status === 'no-subject' && (
        <div className="border-[3px] border-foreground bg-muted p-6 space-y-2">
          <div className="flex items-center gap-2 text-label font-black uppercase tracking-widest text-foreground">
            <CalendarClock size={16} /> Nothing to write this week
          </div>
          <p className="text-meta font-medium text-foreground/80">{state.reason}</p>
          <p className="text-meta font-bold text-muted-foreground">
            Not a failure. Try a wider window.
          </p>
        </div>
      )}

      {state?.status === 'error' && (
        <div className="border-[3px] border-foreground bg-destructive text-destructive-foreground p-6 space-y-1">
          <div className="flex items-center gap-2 text-label font-black uppercase tracking-widest">
            <AlertTriangle size={16} /> Generation failed
          </div>
          <p className="text-meta font-medium break-words">{state.message}</p>
        </div>
      )}
    </div>
  )
}
