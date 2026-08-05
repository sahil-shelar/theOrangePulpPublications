// @ts-nocheck
import { getAuthors } from '@/lib/api/taxonomy'
import Link from 'next/link'
import { Plus, Edit, Globe } from 'lucide-react'
import AuthorDeleteButton from '@/components/dashboard/AuthorDeleteButton'

export default async function AuthorsDashboardPage() {
  const authors = await getAuthors()

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Content</p>
          <h1 className="font-heading text-4xl font-black uppercase text-foreground">Authors</h1>
        </div>
        <Link href="/dashboard/authors/new" className="brutal-button px-5 py-3 flex items-center justify-center gap-2 text-xs">
          <Plus size={16} /> New Author
        </Link>
      </div>

      <div className="brutal-card p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-foreground text-background text-label font-black uppercase tracking-widest">
              <th className="p-3.5">Author</th>
              <th className="p-3.5 hidden md:table-cell">Slug</th>
              <th className="p-3.5 hidden lg:table-cell">Bio</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">
                  No authors yet
                </td>
              </tr>
            ) : authors.map((author) => (
              <tr key={author.id} className="border-t-[3px] border-foreground hover:bg-muted transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-full border-[2px] border-foreground overflow-hidden bg-muted">
                      {author.avatar_url ? (
                        <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-heading text-sm font-black text-foreground">
                          {author.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-sm">{author.name}</span>
                  </div>
                </td>
                <td className="p-3.5 hidden md:table-cell text-label font-black tracking-widest text-muted-foreground">
                  /{author.slug}
                </td>
                <td className="p-3.5 hidden lg:table-cell text-xs text-muted-foreground max-w-[220px] truncate">
                  {author.bio || '—'}
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/author/${author.slug}`}
                      target="_blank"
                      className="p-2 bg-background border-[2px] border-foreground hover:bg-primary transition-colors"
                      title="View profile"
                    >
                      <Globe size={14} />
                    </Link>
                    <Link
                      href={`/dashboard/authors/${author.id}/edit`}
                      className="p-2 bg-background border-[2px] border-foreground hover:bg-primary transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </Link>
                    <AuthorDeleteButton id={author.id} />
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
