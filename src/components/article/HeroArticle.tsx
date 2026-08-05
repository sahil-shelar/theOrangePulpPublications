import Link from 'next/link'
import Image from 'next/image'
import { ArticleWithRelations } from '@/types/models'
import { typeToRoute } from '@/lib/utils'

export default function HeroArticle({ article }: { article: ArticleWithRelations }) {
  const image = article.cover_image_url || (article as any).movies?.backdrop_url || (article as any).movies?.poster_url

  return (
    <Link
      href={`/${typeToRoute(article.type)}/${article.slug}`}
      className="block group w-full relative h-[42vh] md:h-[72vh] overflow-hidden"
    >
      {/* Background image — LCP element on the homepage, so eager + priority */}
      <div className="absolute inset-0">
        {image ? (
          <Image
            src={image}
            alt={article.title}
            fill
            priority
            sizes="100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 img-scrim" />

      {/* Badges — top-left on mobile, bottom-right on desktop */}
      <div className="absolute top-4 left-4 md:top-auto md:bottom-8 md:left-auto md:right-8 flex items-center gap-2 z-10">
        <span className="bg-primary text-primary-foreground text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] border-foreground">
          {article.type}
        </span>
        {article.categories && (
          <span className="bg-background/10 text-on-media text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] border-on-media/30">
            {article.categories.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto">

        {/* Title */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase text-on-media leading-[0.92] md:w-3/4 group-hover:text-primary transition-colors duration-300">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mt-5 text-label font-black uppercase tracking-widest text-on-media/80">
          <span>{article.authors?.name || 'Editorial Team'}</span>
          <span className="text-on-media/30">·</span>
          <span>{new Date(article.published_at || article.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
          {article.reading_time && (
            <>
              <span className="text-on-media/30">·</span>
              <span>{article.reading_time} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
