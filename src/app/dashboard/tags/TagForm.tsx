'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTag, updateTag } from '@/lib/actions/tags'

type TagData = {
  id?: string
  name: string
  slug: string
  description?: string | null
}

export default function TagForm({ initialData }: { initialData?: TagData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updateTag(initialData.id, formData)
        } else {
          await createTag(formData)
        }
        router.push('/dashboard/tags')
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="brutal-card p-6 md:p-8 bg-background flex flex-col gap-6 max-w-2xl">
      {error && <div className="bg-red-500 text-white p-4 font-bold border-[3px] border-foreground uppercase">{error}</div>}
      
      <div className="flex flex-col gap-2">
        <label className="text-label font-black uppercase tracking-widest text-foreground">Name</label>
        <input 
          type="text" 
          value={formData.name}
          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
          className="brutal-input p-3"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-label font-black uppercase tracking-widest text-foreground">Slug</label>
        <input 
          type="text" 
          value={formData.slug}
          onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
          className="brutal-input p-3"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-label font-black uppercase tracking-widest text-foreground">Description</label>
        <textarea 
          value={formData.description}
          onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
          className="brutal-input p-3 min-h-[120px]"
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="brutal-button bg-primary py-4 text-center w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : (initialData?.id ? 'Update Tag' : 'Create Tag')}
      </button>
    </form>
  )
}
