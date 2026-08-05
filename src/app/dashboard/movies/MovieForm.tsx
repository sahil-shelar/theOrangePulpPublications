'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMovie, updateMovie } from '@/lib/actions/movies'

type MovieData = {
  id?: string
  title: string
  slug: string
  synopsis?: string
  poster_url?: string
  backdrop_url?: string
  runtime?: number | null
  director?: string
}

export default function MovieForm({ initialData }: { initialData?: MovieData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    synopsis: initialData?.synopsis || '',
    poster_url: initialData?.poster_url || '',
    backdrop_url: initialData?.backdrop_url || '',
    runtime: initialData?.runtime?.toString() || '',
    director: initialData?.director || '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(p => ({ ...p, [field]: e.target.value }))

  const autoSlug = () => {
    if (!formData.slug && formData.title) {
      setFormData(p => ({ ...p, slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        const fd = new FormData()
        Object.entries(formData).forEach(([k, v]) => fd.set(k, v))
        if (initialData?.id) {
          await updateMovie(initialData.id, fd)
        } else {
          await createMovie(fd)
        }
        router.push('/dashboard/movies')
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      }
    })
  }

  const inputClass = 'w-full bg-background border-[3px] border-foreground p-3 font-bold text-sm'
  const labelClass = 'text-[10px] font-black uppercase tracking-widest text-foreground'

  return (
    <form onSubmit={handleSubmit} className="brutal-card p-6 md:p-8 bg-background flex flex-col gap-6 max-w-3xl">
      {error && (
        <div className="bg-red-500 text-white p-4 font-bold border-[3px] border-foreground uppercase text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Title *</label>
          <input type="text" value={formData.title} onChange={set('title')} onBlur={autoSlug} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Slug *</label>
          <input type="text" value={formData.slug} onChange={set('slug')} className={inputClass} required placeholder="url-safe-slug" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Director</label>
          <input type="text" value={formData.director} onChange={set('director')} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Runtime (minutes)</label>
          <input type="number" value={formData.runtime} onChange={set('runtime')} className={inputClass} min={0} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Synopsis</label>
        <textarea value={formData.synopsis} onChange={set('synopsis')} rows={4} className={inputClass + ' resize-none'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Poster URL</label>
          <input type="url" value={formData.poster_url} onChange={set('poster_url')} className={inputClass} placeholder="https://..." />
          {formData.poster_url && (
            <img src={formData.poster_url} alt="poster preview" className="w-24 aspect-[2/3] object-cover border-[3px] border-foreground mt-1" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Backdrop URL</label>
          <input type="url" value={formData.backdrop_url} onChange={set('backdrop_url')} className={inputClass} placeholder="https://..." />
          {formData.backdrop_url && (
            <img src={formData.backdrop_url} alt="backdrop preview" className="w-full aspect-video object-cover border-[3px] border-foreground mt-1" />
          )}
        </div>
      </div>

      <div className="pt-4 border-t-[3px] border-foreground flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="brutal-button bg-primary py-4 px-8 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : (initialData?.id ? 'Update Movie' : 'Create Movie')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="py-4 px-6 border-[3px] border-foreground font-black text-xs uppercase tracking-widest hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
