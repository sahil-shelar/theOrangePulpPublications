'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, AlertTriangle, Check, Database, Eye } from 'lucide-react'
import { generateRankingFromTopic, type GenerateRankingState } from '@/lib/actions/generate'

// Topics that resolve cleanly, plus one that does not — the last chip is there so
// the refusal path is discoverable rather than a surprise.
const EXAMPLES = [
  '10 best horror movies',
  'top movies ranked of taika waititi',
  'netflix and chill',
  'best sci-fi of the 90s',
  'thrillers that flopped but aged well',
]

export default function GenerateRankingForm() {
  const [topic, setTopic] = useState('')
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<GenerateRankingState | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !topic.trim()) return
    setPending(true)
    setState(null)
    try {
      setState(await generateRankingFromTopic(topic))
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Generation failed.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="brutal-panel p-6 space-y-4">
        <div>
          <label htmlFor="topic" className="block text-label font-black uppercase tracking-widest text-foreground mb-2">
            Topic
          </label>
          <input
            id="topic"
            name="topic"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            disabled={pending}
            maxLength={200}
            placeholder="10 best horror movies"
            aria-describedby="topic-help"
            className="w-full bg-background border-[3px] border-foreground px-4 py-3 font-medium text-foreground placeholder:text-muted-foreground disabled:opacity-60"
          />
          <p id="topic-help" className="text-meta font-medium text-muted-foreground mt-2">
            Describe the list in your own words. It gets turned into a TMDB query — genre,
            streaming service, director, or time period. Topics that depend on box office,
            awards or “underrated” are refused, because TMDB does not record them.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-label font-black uppercase tracking-widest text-muted-foreground mb-1">
            Try one
          </legend>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(example => (
              <button
                key={example}
                type="button"
                onClick={() => setTopic(example)}
                disabled={pending}
                className="border-[2px] border-foreground bg-background px-3 py-1.5 text-meta font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-60"
              >
                {example}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={pending || !topic.trim()}
          aria-busy={pending}
          className="inline-flex items-center gap-2 bg-foreground text-background border-[3px] border-foreground px-6 py-3 text-label font-black uppercase tracking-widest hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:translate-y-0"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {pending ? 'Generating…' : 'Generate draft'}
        </button>
      </form>

      {/* Announced so the outcome is not visual-only. */}
      <div role="status" aria-live="polite" className="space-y-4">
        {pending && (
          <p className="text-meta font-bold uppercase tracking-widest text-muted-foreground">
            Querying TMDB and writing the draft — usually 10–20 seconds.
          </p>
        )}

        {state?.status === 'ok' && (
          <div className="brutal-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-label font-black uppercase tracking-widest text-foreground">
              <Check size={16} /> Draft created
            </div>

            <h2 className="font-heading text-2xl font-black uppercase leading-tight text-foreground">
              {state.title}
            </h2>

            {/* The resolved query is the point: it is how a human judges whether
                the framing was a fair reading of what was actually selected. */}
            <dl className="space-y-2 border-t-[3px] border-foreground pt-4">
              <div>
                <dt className="text-label font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Database size={12} /> Query that ran
                </dt>
                <dd className="font-medium text-foreground">{state.queryDescription}</dd>
              </div>
              <div>
                <dt className="text-label font-black uppercase tracking-widest text-muted-foreground">Angle</dt>
                <dd className="font-medium text-foreground">{state.angle}</dd>
              </div>
              <div>
                <dt className="text-label font-black uppercase tracking-widest text-muted-foreground">Run</dt>
                <dd className="font-medium text-foreground">
                  {state.itemCount} films · {state.model} · {state.totalTokens.toLocaleString()} tokens
                  {state.part > 1 && ` · part ${state.part}`}
                </dd>
              </div>
              {state.excludedCount > 0 && (
                <div>
                  <dt className="text-label font-black uppercase tracking-widest text-muted-foreground">Continuation</dt>
                  <dd className="font-medium text-foreground">
                    {state.excludedCount} films skipped because earlier parts already used them
                  </dd>
                </div>
              )}
            </dl>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/preview/${state.articleId}`}
                target="_blank"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-[3px] border-foreground px-5 py-2.5 text-label font-black uppercase tracking-widest hover:-translate-y-0.5 transition-transform"
              >
                <Eye size={14} strokeWidth={2.5} /> Preview
              </Link>
              <Link
                href={`/dashboard/articles/${state.articleId}/edit`}
                className="inline-flex items-center gap-2 bg-background text-foreground border-[3px] border-foreground px-5 py-2.5 text-label font-black uppercase tracking-widest hover:bg-muted transition-colors"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => { setState(null); setTopic('') }}
                className="inline-flex items-center gap-2 bg-background text-foreground border-[3px] border-foreground px-5 py-2.5 text-label font-black uppercase tracking-widest hover:bg-muted transition-colors"
              >
                New topic
              </button>
            </div>

            <p className="text-meta font-medium text-muted-foreground border-t-[2px] border-foreground/10 pt-3">
              Saved as a draft. Read it before publishing — the blurbs are written from
              TMDB synopses and can still contain claims the data does not support.
            </p>
          </div>
        )}

        {state?.status === 'unsupported' && (
          <div className="brutal-panel bg-secondary p-6 space-y-2">
            <div className="flex items-center gap-2 text-label font-black uppercase tracking-widest text-foreground">
              <AlertTriangle size={16} /> Can’t query that
            </div>
            <p className="font-medium text-foreground">{state.reason}</p>
            <p className="text-meta font-medium text-foreground/70">
              Nothing was created. Rephrase around a genre, streaming service, director or
              time period.
            </p>
          </div>
        )}

        {state?.status === 'error' && (
          <div className="brutal-panel p-6 space-y-2 border-red-500">
            <div className="flex items-center gap-2 text-label font-black uppercase tracking-widest text-foreground">
              <AlertTriangle size={16} /> Generation failed
            </div>
            <p className="font-medium text-foreground break-words">{state.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
