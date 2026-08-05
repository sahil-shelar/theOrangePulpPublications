import Link from 'next/link'
import { getCachedLists } from '@/lib/api/articles'
import ArticleCard from '@/components/article/ArticleCard'
import LetterboxdRow from '@/components/article/LetterboxdRow'

export const revalidate = 60

export default async function ListsPage() {
  const lists = await getCachedLists(20)
  const [featured, ...rest] = lists

  return (
    <div className="w-full bg-background min-h-screen">

      {/* Page header */}

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">

        {lists.length === 0 ? (
          <div className="py-24 text-center font-bold uppercase tracking-widest text-muted-foreground border-[3px] border-dashed border-foreground/20 bg-primary">
            No lists published yet.
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <div className="mb-12">
                <Link
                  href={`/lists/${(featured as any).slug}`}
                  className="group block brutal-card p-0 overflow-hidden hover:-translate-y-1 transition-transform"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5">
                    <div className="md:col-span-3 aspect-[16/9] md:aspect-auto relative border-b-[4px] md:border-b-0 md:border-r-[4px] border-foreground overflow-hidden bg-muted min-h-[260px]">
                      {(() => {
                        const img = (featured as any).cover_image_url || (featured as any).movies?.poster_url
                        return img ? (
                          <img src={img} alt={(featured as any).title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : <div className="w-full h-full bg-primary" />
                      })()}
                      <span className="absolute top-4 left-4 bg-foreground text-background text-[9px] font-black uppercase tracking-widest px-3 py-1.5">
                        List / Ranking
                      </span>
                    </div>
                    <div className="md:col-span-2 bg-primary p-8 md:p-12 flex flex-col justify-center gap-4">
                      <h2 className="font-heading text-3xl md:text-4xl font-black uppercase text-foreground leading-tight group-hover:underline line-clamp-3">
                        {(featured as any).title}
                      </h2>
                      {(featured as any).excerpt && (
                        <p className="text-sm font-medium text-foreground/70 leading-relaxed line-clamp-4">{(featured as any).excerpt}</p>
                      )}
                      <span className="self-start bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-4 py-2 mt-2 border-[2px] border-foreground hover:-translate-y-0.5 transition-transform">
                        View List →
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {rest.length > 0 && (
              <>
                <div className="flex flex-col divide-y-[3px] divide-foreground border-y-[3px] border-foreground md:hidden">
                  {rest.map(post => <LetterboxdRow key={(post as any).id} post={post} href={`/lists/${(post as any).slug}`} />)}
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
