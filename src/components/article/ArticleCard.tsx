import Link from 'next/link'
import { ArticleWithRelations } from '@/types/models'
import { typeToRoute } from '@/lib/utils'

type Props = {
  article: ArticleWithRelations
  variant?: 'default' | 'compact' | 'horizontal'
  accentColor?: string
  imageAspect?: 'landscape' | 'portrait'
}

export default function ArticleCard({ article, variant = 'default', accentColor = 'bg-background', imageAspect = 'landscape' }: Props) {
  const image = article.cover_image_url || (article as any).movies?.poster_url
  const href = `/${typeToRoute(article.type)}/${article.slug}`
  const date = new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="group flex gap-0 brutal-card p-0 overflow-hidden hover:-translate-y-0.5 transition-transform">
        <div className="w-24 shrink-0 aspect-square border-r-[3px] border-foreground overflow-hidden bg-muted">
          {image ? (
            <img src={image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
        </div>
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between bg-background">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-foreground/50 mb-1 truncate">
              {article.categories?.name || article.type}
            </div>
            <h3 className="font-heading text-sm font-black uppercase leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
          </div>
          <div className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mt-2 truncate">{date}</div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={href} className="group block py-4 border-b-[2px] border-foreground last:border-b-0 hover:bg-muted/30 transition-colors px-2">
        <div className="text-[9px] font-black uppercase tracking-widest text-foreground/50 mb-1">{article.categories?.name || article.type}</div>
        <h3 className="font-heading text-lg font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <div className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mt-1.5">{date}</div>
      </Link>
    )
  }

  return (
    <Link href={href} className={`group flex flex-col brutal-card p-0 overflow-hidden hover:-translate-y-1 transition-transform h-full ${accentColor}`}>
      {/* Image */}
      <div className={`${imageAspect === 'portrait' ? 'aspect-[2/3]' : 'aspect-[4/3]'} relative overflow-hidden border-b-[3px] border-foreground bg-muted shrink-0`}>
        {image ? (
          <img
            src={image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center p-8">
            <span className="font-heading text-3xl font-black text-foreground/20 uppercase text-center leading-tight">
              {article.title}
            </span>
          </div>
        )}
        {/* Type badge */}
        <span className="absolute top-3 left-3 bg-primary text-foreground text-[9px] font-black uppercase tracking-widest px-2 py-1 border-[2px] border-foreground">
          {article.type}
        </span>
        {/* Rating */}
        {(article as any).rating && (
          <span className="absolute top-3 right-3 bg-foreground text-background text-xs font-black px-2.5 py-1 border-[2px] border-background">
            {(article as any).rating}/10
          </span>
        )}
      </div>

      {/* Content — grows to fill, byline pinned to bottom */}
      <div className="p-5 bg-background flex flex-col gap-2 flex-1">
        {article.categories && (
          <div className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
            {article.categories.name}
          </div>
        )}
        <h3 className="font-heading text-xl font-black uppercase leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-foreground/40 pt-1 border-t-[2px] border-foreground/10 mt-auto">
          <span>{article.authors?.name || 'Editorial'}</span>
          <span>{date}</span>
        </div>
      </div>
    </Link>
  )
}
