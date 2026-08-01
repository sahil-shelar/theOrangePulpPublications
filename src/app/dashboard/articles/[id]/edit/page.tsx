import ArticleEditor from '@/components/dashboard/ArticleEditor'
import { getCachedCategories, getCachedAuthors, getCachedMoviePickers, getCachedTags } from '@/lib/api/dashboard'
import { getArticleById } from '@/lib/api/articles'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [article, categories, authors, movies, tags] = await Promise.all([
    getArticleById(id),
    getCachedCategories(),
    getCachedAuthors(),
    getCachedMoviePickers(),
    getCachedTags(),
  ])

  if (!article) notFound()

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-7xl mx-auto mb-8">
        <Link href="/dashboard/articles" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background border-[3px] border-transparent hover:border-foreground px-4 py-2 transition-all">
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </div>
      <ArticleEditor
        type={article.type}
        initialData={article}
        categories={categories}
        authors={authors}
        movies={movies}
        tags={tags}
      />
    </div>
  )
}
