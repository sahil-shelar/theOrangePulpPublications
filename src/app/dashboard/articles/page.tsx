import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusCircle, Edit2, Eye } from 'lucide-react'
import ArticleDeleteButton from '@/components/dashboard/ArticleDeleteButton'
import { typeToRoute } from '@/lib/utils'

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('articles')
    .select('*, categories(*), authors(*)')
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('title', `%${q}%`)
  // Only accept values the article_status enum actually allows — a bad ?status=
  // would otherwise reach Postgres and error.
  if (status && (['draft', 'published', 'archived'] as const).includes(status as any)) {
    query = query.eq('status', status as 'draft' | 'published' | 'archived')
  }

  const { data: articles } = await query

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Content</p>
          <h1 className="font-heading text-4xl font-black uppercase tracking-tighter text-foreground">Articles</h1>
        </div>
        <Link href="/dashboard/articles/new" className="brutal-button px-5 py-3 text-xs flex items-center gap-2 bg-primary">
          <PlusCircle size={16} /> New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="brutal-card bg-muted p-4 mb-6 flex flex-wrap gap-3 items-center">
        <form className="flex gap-2 flex-1 min-w-[240px]">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="text"
            name="q"
            placeholder="Search articles…"
            defaultValue={q}
            className="flex-1 bg-background border-[3px] border-foreground px-3 py-2 font-bold text-sm"
          />
          <button type="submit" className="bg-foreground text-background px-4 py-2 font-black uppercase text-label border-[3px] border-foreground hover:bg-primary hover:text-foreground transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1.5">
          {[
            { label: 'All', value: '' },
            { label: 'Published', value: 'published' },
            { label: 'Drafts', value: 'draft' },
          ].map(({ label, value }) => (
            <Link
              key={value}
              href={value ? `/dashboard/articles?status=${value}${q ? `&q=${q}` : ''}` : '/dashboard/articles'}
              className={`px-3 py-2 border-[3px] border-foreground font-black uppercase text-label transition-colors ${
                (status || '') === value ? 'bg-primary' : 'bg-background hover:bg-muted'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="brutal-card bg-background overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-foreground text-background text-label font-black uppercase tracking-widest">
              <th className="p-3.5">Title</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Views</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!articles || articles.length === 0) ? (
              <tr>
                <td colSpan={6} className="p-10 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">
                  No articles found
                </td>
              </tr>
            ) : articles.map((article: any) => (
              <tr key={article.id} className="border-t-[3px] border-foreground hover:bg-muted transition-colors">
                <td className="p-3.5 font-bold text-sm max-w-[280px] truncate">{article.title}</td>
                <td className="p-3.5 text-label font-black uppercase tracking-widest text-muted-foreground">{article.type}</td>
                <td className="p-3.5 text-label font-bold uppercase tracking-wider text-foreground/70">{article.categories?.name || '—'}</td>
                <td className="p-3.5">
                  <span className={`text-label font-black uppercase tracking-widest px-2 py-1 border-[2px] border-foreground ${article.status === 'published' ? 'bg-primary' : 'bg-muted'}`}>
                    {article.status}
                  </span>
                </td>
                <td className="p-3.5 font-bold text-sm text-foreground/70">{article.views_count ?? 0}</td>
                <td className="p-3.5 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`/${typeToRoute(article.type)}/${article.slug}`}
                      target="_blank"
                      className="p-2 border-[2px] border-foreground hover:bg-primary transition-colors bg-background"
                      title="Preview"
                    >
                      <Eye size={15} />
                    </Link>
                    <Link
                      href={`/dashboard/articles/${article.id}/edit`}
                      className="p-2 border-[2px] border-foreground hover:bg-primary transition-colors bg-background"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </Link>
                    <ArticleDeleteButton id={article.id} />
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
