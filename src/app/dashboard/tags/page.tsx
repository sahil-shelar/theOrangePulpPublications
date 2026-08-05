// @ts-nocheck
import { getTags } from '@/lib/api/taxonomy'
import Link from 'next/link'
import { Plus, Edit, Hash } from 'lucide-react'
import TagDeleteButton from '@/components/dashboard/TagDeleteButton'

export default async function TagsDashboardPage() {
  const tags = await getTags()

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Taxonomy</p>
          <h1 className="font-heading text-4xl font-black uppercase text-foreground">Tags</h1>
        </div>
        <Link href="/dashboard/tags/new" className="brutal-button px-5 py-3 flex items-center justify-center gap-2 text-xs">
          <Plus size={16} /> New Tag
        </Link>
      </div>

      <div className="brutal-card p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-foreground text-background text-label font-black uppercase tracking-widest">
              <th className="p-3.5">Name</th>
              <th className="p-3.5 hidden md:table-cell">Slug</th>
              <th className="p-3.5 hidden lg:table-cell">Description</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">
                  No tags yet
                </td>
              </tr>
            ) : tags.map((tag) => (
              <tr key={tag.id} className="border-t-[3px] border-foreground hover:bg-muted transition-colors">
                <td className="p-3.5">
                  <span className="flex items-center gap-1.5 font-bold text-sm">
                    <Hash size={14} className="text-muted-foreground" />
                    {tag.name}
                  </span>
                </td>
                <td className="p-3.5 hidden md:table-cell text-label font-black tracking-widest text-muted-foreground">{tag.slug}</td>
                <td className="p-3.5 hidden lg:table-cell text-xs font-medium text-muted-foreground max-w-[180px] truncate">
                  {tag.description || '—'}
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/dashboard/tags/${tag.id}/edit`}
                      className="p-2 bg-background border-[2px] border-foreground hover:bg-primary transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </Link>
                    <TagDeleteButton id={tag.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
