'use client'

import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react'

type MoviePicker = { id: string; title: string; slug: string | null; poster_url: string | null; release_year: number | null }

export type SpotlightWorkDraft = {
  movie_id: string | null
  custom_title: string
  note: string
}

type Props = {
  movies: MoviePicker[]
  works: SpotlightWorkDraft[]
  onChange: (works: SpotlightWorkDraft[]) => void
}

const emptyWork = (): SpotlightWorkDraft => ({ movie_id: null, custom_title: '', note: '' })

export default function SpotlightWorksEditor({ movies, works, onChange }: Props) {
  const update = (index: number, patch: Partial<SpotlightWorkDraft>) => {
    onChange(works.map((w, i) => (i === index ? { ...w, ...patch } : w)))
  }
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= works.length) return
    const next = [...works]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const remove = (index: number) => onChange(works.filter((_, i) => i !== index))
  const add = () => onChange([...works, emptyWork()])

  return (
    <div className="border-[3px] border-foreground">
      <div className="bg-foreground text-background px-5 py-3 flex items-center justify-between">
        <span className="font-heading text-sm font-black uppercase tracking-widest">Notable Works</span>
        <span className="font-black text-sm">{works.length}</span>
      </div>

      <div className="divide-y-[2px] divide-foreground/10">
        {works.map((work, index) => {
          const selectedMovie = work.movie_id ? movies.find(m => m.id === work.movie_id) : null
          return (
            <div key={index} className="p-4 flex flex-col gap-3 bg-background">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1 shrink-0">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 border-[2px] border-foreground disabled:opacity-20 hover:bg-muted"><ChevronUp size={14} /></button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === works.length - 1} className="p-1 border-[2px] border-foreground disabled:opacity-20 hover:bg-muted"><ChevronDown size={14} /></button>
                </div>

                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex gap-2">
                    <select
                      value={work.movie_id ?? ''}
                      onChange={e => update(index, { movie_id: e.target.value || null, custom_title: e.target.value ? '' : work.custom_title })}
                      className="flex-1 bg-background border-[2px] border-foreground p-2 text-xs font-bold uppercase min-w-0"
                    >
                      <option value="">— Custom title (no movie link) —</option>
                      {movies.map(m => (
                        <option key={m.id} value={m.id}>{m.title}{m.release_year ? ` (${m.release_year})` : ''}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => remove(index)} className="p-2 border-[2px] border-foreground hover:bg-red-500 hover:text-white transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>

                  {!work.movie_id && (
                    <input
                      type="text"
                      placeholder="Title (not in movie database)"
                      value={work.custom_title}
                      onChange={e => update(index, { custom_title: e.target.value })}
                      className="w-full bg-background border-[2px] border-foreground p-2 text-xs font-bold"
                    />
                  )}
                  {selectedMovie && (
                    <div className="text-label font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      {selectedMovie.poster_url && <img src={selectedMovie.poster_url} alt="" className="w-5 h-7 object-cover border border-foreground" />}
                      Linked to movie database
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Note — role, award, why it matters"
                    value={work.note}
                    onChange={e => update(index, { note: e.target.value })}
                    className="w-full bg-background border-[2px] border-foreground p-2 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-primary transition-colors px-5 py-3 text-xs font-black uppercase tracking-widest border-t-[2px] border-foreground"
      >
        <Plus size={14} /> Add Work
      </button>
    </div>
  )
}

export { emptyWork as emptySpotlightWork }
