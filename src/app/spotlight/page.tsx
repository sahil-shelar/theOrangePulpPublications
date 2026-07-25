import Link from 'next/link'
import { getCachedSpotlight } from '@/lib/api/articles'
import ArticleCard from '@/components/article/ArticleCard'
import LetterboxdRow from '@/components/article/LetterboxdRow'

export const revalidate = 60

export default async function SpotlightPage() {
  const spotlight = await getCachedSpotlight(20)
  const [featured, ...rest] = spotlight

  return (
    <div className="w-full bg-background min-h-screen">

      {/* Page header */}

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">

        {spotlight.length === 0 ? (
          <div className="py-24 text-center font-bold uppercase tracking-widest text-foreground/40 border-[3px] border-dashed border-foreground/20 bg-accent">
            No spotlights published yet.
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <div className="mb-12">
                <Link
                  href={`/spotlight/${(featured as any).slug}`}
                  className="group block brutal-card p-0 overflow-hidden hover:-translate-y-1 transition-transform"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="aspect-[16/9] md:aspect-auto relative border-b-[4px] md:border-b-0 md:border-r-[4px] border-foreground overflow-hidden bg-muted min-h-[280px]">
                      {(() => {
                        const img = (featured as any).cover_image_url || (featured as any).movies?.poster_url
                        return img ? (
                          <img src={img} alt={(featured as any).title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : <div className="w-full h-full bg-primary" />
                      })()}
                    </div>
                    <div className="bg-accent p-8 md:p-12 flex flex-col justify-center gap-4">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-foreground text-background px-2 py-1 self-start">
                        Spotlight
                      </span>
                      <h2 className="font-heading text-3xl md:text-5xl font-black uppercase leading-tight group-hover:text-primary transition-colors line-clamp-3">
                        {(featured as any).title}
                      </h2>
                      {(featured as any).excerpt && (
                        <p className="text-sm font-medium text-foreground/70 leading-relaxed line-clamp-3">{(featured as any).excerpt}</p>
                      )}
                      <div className="text-[9px] font-black uppercase tracking-widest text-foreground/50 pt-4 border-t-[1px] border-foreground/20">
                        {(featured as any).authors?.name || 'Editorial'} · {new Date((featured as any).published_at || (featured as any).created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {rest.length > 0 && (
              <>
                <div className="flex flex-col divide-y-[3px] divide-foreground border-y-[3px] border-foreground md:hidden">
                  {rest.map(post => <LetterboxdRow key={(post as any).id} post={post} href={`/spotlight/${(post as any).slug}`} />)}
                </div>
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-5">
                  {rest.map(post => <ArticleCard key={(post as any).id} article={post as any} imageAspect="portrait" />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
