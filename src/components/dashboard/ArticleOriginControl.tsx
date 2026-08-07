'use client'

// Shows which site an article belongs to, and promotes it to production.
//
// Deliberately separate from the status badge beside it. `status` answers "is
// this finished"; `origin` answers "which site is this for". They were the same
// thing until 350 seeded demo articles turned up published on production, so the
// dashboard now shows both — an article can be `published` and still invisible
// to the world because it is `local`.

import { useState, useTransition } from 'react'
import { Upload, Undo2, Check } from 'lucide-react'
import { setArticleOrigin } from '@/lib/actions/articles'
import type { DataOrigin } from '@/lib/data-origin'

// Pastel fills are light in BOTH themes, so text on them is pinned to
// primary-foreground rather than a token that flips.
const TONE: Record<DataOrigin, string> = {
  production: 'bg-primary text-primary-foreground',
  local: 'bg-secondary text-primary-foreground',
  seed: 'bg-muted text-muted-foreground',
}

const LABEL: Record<DataOrigin, string> = {
  production: 'Live',
  local: 'Local',
  seed: 'Seed',
}

export default function ArticleOriginControl({
  id,
  origin,
}: {
  id: string
  origin: DataOrigin
}) {
  const [current, setCurrent] = useState<DataOrigin>(origin)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function move(next: DataOrigin) {
    setError(null)
    startTransition(async () => {
      const result = await setArticleOrigin(id, next)
      // A failed promotion that silently looked successful would be worse than
      // no button: the editor would believe the article is live.
      if (result && 'error' in result && result.error) {
        setError(String(result.error))
        return
      }
      setCurrent(next)
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        <span className={`text-label font-black uppercase tracking-widest px-2 py-1 border-[2px] border-foreground ${TONE[current]}`}>
          {LABEL[current]}
        </span>

        {current === 'production' ? (
          <button
            type="button"
            onClick={() => move('local')}
            disabled={pending}
            title="Pull back to local — removes it from the live site"
            className="p-1.5 border-[2px] border-foreground bg-background hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Undo2 size={13} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => move('production')}
            disabled={pending}
            title="Push to prod — makes it visible on the live site"
            className="p-1.5 border-[2px] border-foreground bg-background hover:bg-primary transition-colors disabled:opacity-50"
          >
            {pending ? <Check size={13} className="animate-pulse" /> : <Upload size={13} strokeWidth={2.5} />}
          </button>
        )}
      </div>

      {error && <span className="text-label font-bold text-destructive max-w-[180px]">{error}</span>}
    </div>
  )
}
