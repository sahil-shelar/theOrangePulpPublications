// @ts-nocheck
import Link from 'next/link'
import { getPagedArticlesByType } from '@/lib/api/articles'
import Pagination from '@/components/layout/Pagination'
import ArticleCard from '@/components/article/ArticleCard'
import LetterboxdRow from '@/components/article/LetterboxdRow'

export const revalidate = 60

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const { articles: reviews, page: currentPage, totalPages } = await getPagedArticlesByType('review', Number(pageParam) || 1)
  // The oversized featured card only makes sense on the first page.
  const featured = currentPage === 1 ? reviews[0] : null
  const rest = currentPage === 1 ? reviews.slice(1) : reviews

  return (
    <div className="w-full bg-background min-h-screen">

      {/* Page header */}

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">

        {reviews.length === 0 ? (
          <EmptyState message="No reviews published yet." />
        ) : (
          <>
            {/* Featured first review */}
            {featured && (
              <div className="mb-12">
                <FeaturedCard post={featured} href={`/reviews/${featured.slug}`} accentColor="bg-secondary" />
              </div>
            )}

            {/* Mobile: Letterboxd list — Desktop: portrait grid */}
            {rest.length > 0 && (
              <>
                {/* Mobile list (< md) */}
                <div className="flex flex-col divide-y-[3px] divide-foreground border-y-[3px] border-foreground md:hidden">
                  {rest.map(post => <LetterboxdRow key={post.id} post={post} href={`/reviews/${post.slug}`} />)}
                </div>

                {/* Desktop grid (md+) */}
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-5">
                  {rest.map(post => (
                    <ArticleCard key={post.id} article={post as any} imageAspect="portrait" />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <Pagination basePath="/reviews" page={currentPage} totalPages={totalPages} />
      </div>
    </div>
  )
}


function FeaturedCard({ post, href, accentColor }: { post: any; href: string; accentColor: string }) {
  const image = post.cover_image_url || post.movies?.poster_url
  return (
    <Link href={href} className="group block brutal-card p-0 overflow-hidden hover:-translate-y-1 transition-transform">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-[4/3] md:aspect-auto relative border-b-[4px] md:border-b-0 md:border-r-[4px] border-foreground overflow-hidden bg-muted">
          {image ? (
            <img src={image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
          {post.rating && (
            <span className="absolute top-4 right-4 bg-foreground text-background font-black text-xl px-4 py-2 border-[3px] border-background shadow-[3px_3px_0_0_#E2BFCA]">
              {post.rating}/5
            </span>
          )}
        </div>
        <div className={`${accentColor} p-8 md:p-12 flex flex-col justify-center gap-4`}>
          <div className="flex items-center gap-2">
            <span className="text-label font-black uppercase tracking-widest bg-foreground text-background px-2 py-1">Review</span>
            {post.categories?.name && (
              <span className="text-label font-black uppercase tracking-widest text-muted-foreground">{post.categories.name}</span>
            )}
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-black uppercase text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-3">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm font-medium text-foreground/70 leading-relaxed line-clamp-3">{post.excerpt}</p>
          )}
          <div className="flex items-center justify-between text-label font-black uppercase tracking-widest text-muted-foreground pt-4 border-t-[2px] border-foreground/20">
            <span>{post.authors?.name || 'Editorial'}</span>
            <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-24 text-center font-bold uppercase tracking-widest text-muted-foreground border-[3px] border-dashed border-foreground/20 bg-secondary">
      {message}
    </div>
  )
}
