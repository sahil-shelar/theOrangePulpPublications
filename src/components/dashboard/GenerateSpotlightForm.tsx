'use client'

// On-demand Spotlight generation.
//
// Two ways to pick a subject, and neither is "choose whoever you like off the
// top of your head":
//
//  - Leave the director field empty: the pipeline picks whoever released a
//    film in the release window, because "why this person, why now" cannot be
//    invented — the module header in spotlights.ts explains why there is no
//    open-ended topic box, the way rankings has.
//  - Name a director: the editor is the answer to "why now" by choosing them,
//    so the trigger becomes their most recent directed release regardless of
//    window. Still a real, verifiable film to lead the piece from — never a
//    synthetic career overview.
//
// Actors are not supported. An actor's spotlight needs a differently shaped
// subject — cast credits instead of directed ones, no "directed since"
// framing — and the system instruction that keeps the model from writing
// biography was built around a filmography of films the person MADE. That is
// a separate feature, not a text field on this one.

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, AlertTriangle, Check, CalendarClock, Eye, UserX } from 'lucide-react'
import { generateSpotlightNow, type GenerateSpotlightState } from '@/lib/actions/generate'

const DEFAULT_WINDOW = 10

export default function GenerateSpotlightForm() {
  const [personName, setPersonName] = useState('')
  const [windowDays, setWindowDays] = useState(String(DEFAULT_WINDOW))
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<GenerateSpotlightState | null>(null)

  const named = personName.trim().length > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setState(null)
    try {
      setState(
        await generateSpotlightNow({
          personName: named ? personName.trim() : undefined,
          // The window only means anything for auto-pick; sending it alongside
          // a name would silently do nothing, which is worse than not sending
          // it — better the field visibly disable than quietly not apply.
          windowDays: named ? undefined : Number(windowDays),
        })
      )
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
          <label htmlFor="personName" className="block text-label font-black uppercase tracking-widest text-foreground mb-2">
            Director <span className="text-muted-foreground normal-case font-bold">(optional)</span>
          </label>
          <input
            id="personName"
            type="text"
            value={personName}
            onChange={e => setPersonName(e.target.value)}
            disabled={pending}
            maxLength={200}
            placeholder="Leave blank to auto-pick from this week's releases"
            className="w-full bg-background border-[3px] border-foreground px-4 py-3 font-medium text-foreground placeholder:text-muted-foreground disabled:opacity-60"
          />
          <p className="text-meta font-medium text-muted-foreground mt-2">
            Named, the piece leads from whichever of their films released most recently —
            it does not have to be brand new. Directors only; an actor spotlight is a
            different piece TMDB data cannot support the same way.
          </p>
        </div>

        <div className={named ? 'opacity-50 pointer-events-none' : undefined}>
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
              disabled={pending || named}
              className="w-28 bg-background border-[3px] border-foreground px-4 py-3 font-medium text-foreground disabled:opacity-60"
            />
            <span className="text-meta font-bold uppercase tracking-widest text-muted-foreground">days back</span>
          </div>
          <p className="text-meta font-medium text-muted-foreground mt-2">
            {named
              ? 'Ignored while a director is named above.'
              : 'The subject is not chosen on merit — it is whichever director released a film in this window and has enough earlier work to fill the Notable Works grid. Widen the window if a quiet week turns up nobody.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="brutal-button px-6 py-3 text-xs flex items-center gap-2 disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {pending ? 'Generating…' : named ? `Generate: ${personName.trim()}` : 'Generate Spotlight'}
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

      {/* Also not styled as a hard error: the request was understood, it just
          cannot be honoured as asked — closer to the ranking form's
          "unsupported topic" than to a broken run. */}
      {state?.status === 'unavailable' && (
        <div className="border-[3px] border-foreground bg-muted p-6 space-y-2">
          <div className="flex items-center gap-2 text-label font-black uppercase tracking-widest text-foreground">
            <UserX size={16} /> Can&apos;t build that spotlight
          </div>
          <p className="text-meta font-medium text-foreground/80">{state.reason}</p>
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
