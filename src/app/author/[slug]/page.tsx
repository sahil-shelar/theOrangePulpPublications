// @ts-nocheck
import { getAuthorBySlug } from '@/lib/api/taxonomy'
import { getArticlesByAuthor } from '@/lib/api/articles'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ArticleCard from '@/components/article/ArticleCard'
import LetterboxdRow from '@/components/article/LetterboxdRow'
import { typeToRoute } from '@/lib/utils'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = await getAuthorBySlug(slug)
  if (!author) return {}
  return { title: `${author.name} | The Orange Pulp`, description: author.bio }
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = await getAuthorBySlug(slug)
  if (!author) notFound()

  const articles = await getArticlesByAuthor(author.id, 20)

  return (
    <div className="w-full bg-background min-h-screen">


      {/* Articles */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <h2 className="font-heading text-3xl font-black uppercase text-foreground mb-8 border-b-[3px] border-foreground pb-3">
          Articles by {author.name}
          <span className="ml-3 text-foreground/30">({articles.length})</span>
        </h2>

        {articles.length === 0 ? (
          <div className="py-20 text-center font-bold uppercase tracking-widest text-foreground/40 border-[3px] border-dashed border-foreground/20 bg-muted">
            No articles published yet.
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
