import Link from 'next/link'

type Props = {
  post: any
  href: string
}

export default function LetterboxdRow({ post, href }: Props) {
  const image = post.cover_image_url || post.movies?.poster_url
  const year = post.movies?.release_year || (post.published_at ? new Date(post.published_at).getFullYear() : null)
  const date = new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 py-4 hover:bg-muted/40 transition-colors"
    >
      {/* Poster/cover thumbnail */}
      <div className="w-14 shrink-0 aspect-[2/3] border-[2px] border-foreground bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="font-heading text-base font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          {year && <span className="text-[10px] font-bold text-muted-foreground shrink-0">{year}</span>}
        </div>

        {post.rating && (
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-[11px] ${i < Math.round(post.rating) ? 'text-foreground' : 'text-muted-foreground'}`}>★</span>
            ))}
            <span className="text-[9px] font-black text-muted-foreground ml-1">{post.rating}/5</span>
          </div>
        )}

        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          {post.authors?.name || 'Editorial'} · {date}
        </div>
      </div>

      {post.categories?.name && (
        <span className="shrink-0 text-[8px] font-black uppercase tracking-widest bg-foreground text-background px-2 py-0.5">
          {post.categories.name}
        </span>
      )}
    </Link>
  )
}
