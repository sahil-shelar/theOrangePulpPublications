'use client'

import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react'

type MoviePicker = { id: string; title: string; slug: string | null; poster_url: string | null; release_year: number | null }

export type ListItemDraft = {
  movie_id: string | null
  custom_title: string
  blurb: string
  item_rating: string // kept as string for the input, parsed on save
}

type Props = {
  movies: MoviePicker[]
  items: ListItemDraft[]
  onChange: (items: ListItemDraft[]) => void
}

const emptyItem = (): ListItemDraft => ({ movie_id: null, custom_title: '', blurb: '', item_rating: '' })

export default function ListItemsEditor({ movies, items, onChange }: Props) {
  const update = (index: number, patch: Partial<ListItemDraft>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))
  const add = () => onChange([...items, emptyItem()])

  return (
    <div className="border-[3px] border-foreground">
      <div className="bg-foreground text-background px-5 py-3 flex items-center justify-between">
        <span className="font-heading text-sm font-black uppercase tracking-widest">Ranked Items</span>
        <span className="font-black text-sm">{items.length}</span>
      </div>

      <div className="divide-y-[2px] divide-foreground/10">
        {items.map((item, index) => {
          const selectedMovie = item.movie_id ? movies.find(m => m.id === item.movie_id) : null
          return (
            <div key={index} className="p-4 flex flex-col gap-3 bg-background">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <span className="font-heading font-black text-lg text-muted-foreground w-6 text-center">{String(index + 1).padStart(2, '0')}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 border-[2px] border-foreground disabled:opacity-20 hover:bg-muted"><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="p-1 border-[2px] border-foreground disabled:opacity-20 hover:bg-muted"><ChevronDown size={14} /></button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex gap-2">
                    <select
                      value={item.movie_id ?? ''}
                      onChange={e => update(index, { movie_id: e.target.value || null, custom_title: e.target.value ? '' : item.custom_title })}
                      className="flex-1 bg-background border-[2px] border-foreground p-2 text-xs font-bold uppercase min-w-0"
                    >
                      <option value="">— Custom title (no movie link) —</option>
                      {movies.map(m => (
                        <option key={m.id} value={m.id}>{m.title}{m.release_year ? ` (${m.release_year})` : ''}</option>
                      ))}
                    </select>
                    <input
                      type="number" min="0" max="5" step="0.5"
                      placeholder="Rating"
                      value={item.item_rating}
                      onChange={e => update(index, { item_rating: e.target.value })}
                      className="w-24 bg-background border-[2px] border-foreground p-2 text-xs font-bold shrink-0"
                    />
                    <button type="button" onClick={() => remove(index)} className="p-2 border-[2px] border-foreground hover:bg-red-500 hover:text-white transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>

                  {!item.movie_id && (
                    <input
                      type="text"
                      placeholder="Title (not in movie database)"
                      value={item.custom_title}
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

                  <textarea
                    placeholder="Blurb — why it's ranked here (2-3 sentences)"
                    value={item.blurb}
                    onChange={e => update(index, { blurb: e.target.value })}
                    rows={2}
                    className="w-full bg-background border-[2px] border-foreground p-2 text-xs font-medium resize-none"
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
        <Plus size={14} /> Add Item
      </button>
    </div>
  )
}

export { emptyItem as emptyListItem }
