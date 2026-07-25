import Link from 'next/link'
import { ArticleWithRelations } from '@/types/models'
import { typeToRoute } from '@/lib/utils'

export default function HeroArticle({ article }: { article: ArticleWithRelations }) {
  const image = article.cover_image_url || (article as any).movies?.backdrop_url || (article as any).movies?.poster_url

  return (
    <Link
      href={`/${typeToRoute(article.type)}/${article.slug}`}
      className="block group w-full relative h-[58vh] md:h-[72vh] overflow-hidden border-b-[4px] border-foreground"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        {image ? (
          <img
            src={image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/30 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-primary text-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-[2px] border-foreground">
            {article.type}
          </span>
          {article.categories && (
            <span className="bg-background/10 text-background text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-[2px] border-background/30">
              {article.categories.name}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase text-background leading-[0.92] md:w-3/4 group-hover:text-primary transition-colors duration-300">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mt-5 text-[10px] font-black uppercase tracking-widest text-background/60">
          <span>{article.authors?.name || 'Editorial Team'}</span>
          <span className="text-background/30">·</span>
          <span>{new Date(article.published_at || article.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
          {article.reading_time && (
            <>
              <span className="text-background/30">·</span>
              <span>{article.reading_time} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
