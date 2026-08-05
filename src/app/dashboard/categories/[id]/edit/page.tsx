// @ts-nocheck
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { updateCategory } from '@/lib/actions/categories'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: category, error } = await supabase.from('categories').select('*').eq('id', id).single()

  if (error || !category) notFound()

  const action = updateCategory.bind(null, id)

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/dashboard/categories" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors mb-3">
            <ArrowLeft size={16} /> Back to Categories
          </Link>
          <h1 className="font-heading text-4xl font-black uppercase text-foreground">Edit Category</h1>
        </div>
      </div>

      <form action={action} className="space-y-6 brutal-card bg-background p-8">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Category Name</label>
          <input
            type="text"
            name="name"
            defaultValue={category.name}
            required
            className="w-full bg-background border-[3px] border-foreground p-3 font-bold"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">URL Slug</label>
          <input
            type="text"
            name="slug"
            defaultValue={category.slug}
            required
            className="w-full bg-background border-[3px] border-foreground p-3 font-bold font-mono text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={category.description || ''}
            className="w-full bg-background border-[3px] border-foreground p-3 font-bold"
          />
        </div>

        <div className="pt-4 border-t-[3px] border-foreground">
          <button type="submit" className="brutal-button py-4 px-8 w-full flex items-center justify-center gap-2">
            <Save size={18} /> Update Category
          </button>
        </div>
      </form>
    </div>
  )
}
