// @ts-nocheck
import { getCategoryBySlug, getCategories } from '@/lib/api/taxonomy'
import { getArticlesByCategory } from '@/lib/api/articles'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ArticleCard from '@/components/article/ArticleCard'
import { typeToRoute } from '@/lib/utils'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return { title: `${category.name} | The Orange Pulp`, description: category.description }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  // parallel — category.id is known, getCategories is independent
  const [articles, allCategories] = await Promise.all([
    getArticlesByCategory(category.id, 20),
    getCategories(),
  ])
  const otherCategories = allCategories.filter(c => c.id !== category.id).slice(0, 6)

  const [featured, ...rest] = articles

  return (
    <div className="w-full bg-background min-h-screen">

      {/* Header */}
      <div className="border-b-[4px] border-foreground bg-primary">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Category</p>
          <h1 className="font-heading text-6xl md:text-8xl font-black uppercase text-foreground leading-none mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-base font-bold text-muted-foreground max-w-xl">{category.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Articles */}
        <div className="lg:col-span-8">
          {articles.length === 0 ? (
            <div className="py-20 text-center font-bold uppercase tracking-widest text-muted-foreground border-[3px] border-dashed border-foreground/20 bg-muted">
              No articles in this category yet.
            </div>
          ) : (
            <>
              {/* Featured first */}
              {featured && (
                <div className="mb-8">
                  <Link
                    href={`/${typeToRoute(featured.type)}/${featured.slug}`}
                    className="group block brutal-card p-0 overflow-hidden hover:-translate-y-1 transition-transform"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="aspect-[4/3] md:aspect-auto relative border-b-[4px] md:border-b-0 md:border-r-[4px] border-foreground overflow-hidden bg-muted min-h-[220px]">
                        {(featured.cover_image_url || featured.movies?.poster_url) ? (
                          <img
                            src={featured.cover_image_url || featured.movies.poster_url}
                            alt={featured.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : <div className="w-full h-full bg-primary" />}
                      </div>
                      <div className="bg-primary p-7 flex flex-col justify-center gap-3">
                        <span className="text-label font-black uppercase tracking-widest bg-foreground text-background px-2 py-1 self-start">{featured.type}</span>
                        <h2 className="font-heading text-2xl md:text-3xl font-black uppercase text-foreground leading-tight group-hover:underline line-clamp-3">
                          {featured.title}
                        </h2>
                        {featured.excerpt && (
                          <p className="text-sm font-medium text-foreground/70 line-clamp-2">{featured.excerpt}</p>
                        )}
                        <div className="text-label font-black uppercase tracking-widest text-muted-foreground">
                          {new Date(featured.published_at || featured.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Rest in grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {rest.map(post => (
                    <ArticleCard key={post.id} article={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-10">
          <div className="brutal-card bg-secondary p-7">
            <h3 className="font-heading text-xl font-black uppercase text-foreground mb-5 border-b-[3px] border-foreground pb-2">
              Explore More
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map(c => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="bg-background text-foreground border-[3px] border-foreground px-3 py-2 text-label font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
