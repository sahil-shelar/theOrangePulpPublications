'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type MovieSlide = {
  tmdb_id?: number
  slug?: string
  title: string
  poster_url: string | null
  release_date?: string | null
  rating?: number | null
  overview?: string | null
}

type Props = {
  movies: MovieSlide[]
  linkBase?: string // '/movie' for internal, undefined for TMDB-only (no link)
}

export default function MovieCarousel({ movies, linkBase }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (!movies.length) return null

  return (
    <div className="relative group/carousel">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1/2 w-10 h-10 bg-background border-[3px] border-foreground flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary disabled:hidden"
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-1/2 w-10 h-10 bg-background border-[3px] border-foreground flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary"
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>

      {/* Track */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, i) => {
          const year = movie.release_date?.split('-')[0]
          const inner = (
            <div className="group/card snap-start shrink-0 w-28 sm:w-36 cursor-pointer">
              {/* Poster */}
              <div className="aspect-[2/3] border-[3px] border-foreground bg-muted overflow-hidden relative">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center p-2">
                    <span className="text-label font-black uppercase text-center text-muted-foreground leading-tight">{movie.title}</span>
                  </div>
                )}
              </div>
              {/* Title */}
              <div className="mt-2 px-0.5">
                <div className="text-label font-black uppercase leading-tight text-foreground line-clamp-2 group-hover/card:text-primary transition-colors">
                  {movie.title}
                </div>
                {year && <div className="text-label font-bold text-muted-foreground mt-0.5">{year}</div>}
              </div>
            </div>
          )

          if (linkBase && movie.slug) {
            return <Link key={movie.slug || i} href={`${linkBase}/${movie.slug}`}>{inner}</Link>
          }
          if (movie.tmdb_id) {
            return <Link key={movie.tmdb_id} href={`/movie/tmdb/${movie.tmdb_id}`}>{inner}</Link>
          }
          return <div key={i}>{inner}</div>
        })}
      </div>
    </div>
  )
}
