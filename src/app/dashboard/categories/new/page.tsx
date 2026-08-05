import { createCategory } from '@/lib/actions/categories'
import { Save } from 'lucide-react'
import Link from 'next/link'

export default function NewCategoryPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">New Category</h1>
        <Link href="/dashboard/categories" className="text-xs font-black uppercase tracking-widest hover:underline text-foreground/70">Cancel</Link>
      </div>

      <form action={createCategory} className="space-y-6 brutal-card p-8">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Category Name</label>
          <input type="text" name="name" required className="w-full bg-background border-[3px] border-foreground p-3 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">URL Slug</label>
          <input type="text" name="slug" required className="w-full bg-background border-[3px] border-foreground p-3 font-bold font-mono text-sm" placeholder="e.g. movie-reviews" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Description</label>
          <textarea name="description" rows={4} className="w-full bg-background border-[3px] border-foreground p-3 font-bold" />
        </div>
        
        <div className="pt-4 border-t-[3px] border-foreground">
          <button type="submit" className="brutal-button py-4 px-8 w-full flex items-center justify-center gap-2">
            <Save size={16} /> Create Category
          </button>
        </div>
      </form>
    </div>
  )
}
