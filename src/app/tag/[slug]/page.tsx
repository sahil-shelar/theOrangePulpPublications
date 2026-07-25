// @ts-nocheck
import { getTagBySlug } from '@/lib/api/taxonomy'
import { getArticlesByTag } from '@/lib/api/articles'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/article/ArticleCard'
import LetterboxdRow from '@/components/article/LetterboxdRow'
import { typeToRoute } from '@/lib/utils'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) return {}
  return { title: `#${tag.name} | The Orange Pulp` }
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) notFound()

  const articles = await getArticlesByTag(tag.id, 20)

  return (
    <div className="w-full bg-background min-h-screen">

      {/* Header */}

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        {articles.length === 0 ? (
          <div className="py-20 text-center font-bold uppercase tracking-widest text-foreground/40 border-[3px] border-dashed border-foreground/20 bg-muted">
            No articles found for this tag.
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y-[3px] divide-foreground border-y-[3px] border-foreground md:hidden">
              {articles.map(post => <LetterboxdRow key={post.id} post={post} href={`/${typeToRoute(post.type)}/${post.slug}`} />)}
            </div>
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-5">
              {articles.map(post => <ArticleCard key={post.id} article={post} imageAspect="portrait" />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
