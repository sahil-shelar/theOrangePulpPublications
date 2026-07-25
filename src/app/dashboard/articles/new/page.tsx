import ArticleEditor from '@/components/dashboard/ArticleEditor'
import { getCachedCategories, getCachedAuthors, getCachedMoviePickers, getCachedTags } from '@/lib/api/dashboard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewArticlePage() {
  const [categories, authors, movies, tags] = await Promise.all([
    getCachedCategories(),
    getCachedAuthors(),
    getCachedMoviePickers(),
    getCachedTags(),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto mb-6">
        <Link href="/dashboard/articles" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background border-[3px] border-transparent hover:border-foreground px-4 py-2 transition-all">
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </div>
      <ArticleEditor
        categories={categories}
        authors={authors}
        movies={movies}
        tags={tags}
      />
    </div>
  )
}
