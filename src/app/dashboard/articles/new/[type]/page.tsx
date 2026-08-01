import ArticleEditor from '@/components/dashboard/ArticleEditor'
import { getCachedCategories, getCachedAuthors, getCachedMoviePickers, getCachedTags } from '@/lib/api/dashboard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

const VALID_TYPES = ['news', 'review', 'spotlight', 'list'] as const
type ArticleType = (typeof VALID_TYPES)[number]

export default async function NewTypedArticlePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (!VALID_TYPES.includes(type as ArticleType)) notFound()

  const [categories, authors, movies, tags] = await Promise.all([
    getCachedCategories(),
    getCachedAuthors(),
    getCachedMoviePickers(),
    getCachedTags(),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto mb-6">
        <Link href="/dashboard/articles/new" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background border-[3px] border-transparent hover:border-foreground px-4 py-2 transition-all">
          <ArrowLeft size={16} /> Change Type
        </Link>
      </div>
      <ArticleEditor
        type={type as ArticleType}
        categories={categories}
        authors={authors}
        movies={movies}
        tags={tags}
      />
    </div>
  )
}
