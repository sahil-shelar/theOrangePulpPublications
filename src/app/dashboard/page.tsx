import { getDashboardStats } from '@/lib/api/dashboard'
import Link from 'next/link'
import { PlusCircle, FileText, Star, Newspaper, List, ArrowRight, Edit2 } from 'lucide-react'
import { ArticleWithRelations } from '@/types/models'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-[3px] border-foreground pb-6">
        <div>
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Editorial</p>
          <h1 className="font-heading text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction href="/dashboard/articles/new?type=review" icon={<Star size={14}/>} label="Review" />
          <QuickAction href="/dashboard/articles/new?type=news" icon={<Newspaper size={14}/>} label="News" />
          <QuickAction href="/dashboard/articles/new?type=spotlight" icon={<PlusCircle size={14}/>} label="Spotlight" />
          <QuickAction href="/dashboard/articles/new?type=list" icon={<List size={14}/>} label="List" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats.totalArticles} />
        <StatCard label="Published" value={stats.publishedArticles} accent="bg-secondary" />
        <StatCard label="Drafts" value={stats.drafts} accent="bg-primary" />
        <StatCard label="Categories" value={stats.categories} />
        <StatCard label="Movies" value={stats.movies} />
        <StatCard label="Subscribers" value={stats.subscribers} accent="bg-secondary" />
      </div>

      {/* Article lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ArticleTable title="Latest Articles" articles={stats.latestArticles} />
        <ArticleTable title="Recent Drafts" articles={stats.recentDrafts} />
      </div>

    </div>
  )
}

function StatCard({ label, value, accent = 'bg-background' }: { label: string; value: number; accent?: string }) {
  return (
    <div className={`brutal-card ${accent} p-5 flex flex-col`}>
      <span className="font-heading text-4xl font-black text-foreground leading-none mb-2">{value}</span>
      <span className="text-label font-black uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 bg-foreground text-background border-[3px] border-foreground px-4 py-2.5 text-label font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 hover:shadow-hard transition-all"
    >
      {icon} {label}
    </Link>
  )
}

function ArticleTable({ title, articles }: { title: string; articles: ArticleWithRelations[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-black uppercase tracking-widest text-foreground">{title}</h2>
        <Link href="/dashboard/articles" className="flex items-center gap-1 text-label font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="brutal-card p-0 overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            No articles found
          </div>
        ) : (
          <div className="divide-y-[3px] divide-foreground">
            {articles.map(article => (
              <Link
                key={article.id}
                href={`/dashboard/articles/${article.id}/edit`}
                className="flex items-center gap-4 p-4 hover:bg-muted transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {article.title}
                  </div>
                  <div className="flex gap-2 mt-1 text-label font-black uppercase tracking-widest text-muted-foreground">
                    <span>{article.type}</span>
                    <span>·</span>
                    <span>{article.categories?.name || 'Uncategorized'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-label font-black uppercase tracking-widest px-2 py-1 border-[2px] border-foreground ${article.status === 'published' ? 'bg-primary' : 'bg-background'}`}>
                    {article.status}
                  </span>
                  <Edit2 size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
