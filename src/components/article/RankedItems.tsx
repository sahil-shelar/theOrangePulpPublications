'use client'

// Layout switch for a ranking's items: stacked cards (default) or compact rows.
//
// A client component rather than a `?view=` search param on purpose — the list
// detail route has generateStaticParams + revalidate = 60, and reading a search
// param would make it dynamic, trading away ISR for a presentational
// preference. The choice is remembered in localStorage so it carries across
// articles.

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutGrid, Rows3 } from 'lucide-react'

type RankedView = 'cards' | 'list'

const STORAGE_KEY = 'orangepulp:rankings-view'
const DEFAULT_VIEW: RankedView = 'cards'

type Item = {
  id: string
  rank: number
  blurb?: string | null
  custom_title?: string | null
  item_rating?: number | null
  movies?: {
    title?: string | null
    poster_url?: string | null
    release_year?: number | null
    slug?: string | null
    /* Raw TMDB detail payload, already persisted by the generator. budget and
       revenue live here rather than in columns because the upsert has always
       stored them, which means existing rankings show the figures too. */
    metadata?: { budget?: number | null; revenue?: number | null } | null
  } | null
}

function itemFields(item: Item) {
  const title = item.movies?.title || item.custom_title || 'Untitled'
  return {
    title,
    poster: item.movies?.poster_url ?? null,
    year: item.movies?.release_year ?? null,
    href: item.movies?.slug ? `/movie/${item.movies.slug}` : null,
    rating: item.item_rating ?? null,
    // TMDB sends 0, not null, for figures it does not have — very common for
    // non-US productions. Treated as missing so a card never reads "$0".
    budget: money(item.movies?.metadata?.budget),
    gross: money(item.movies?.metadata?.revenue),
  }
}

function money(value: number | null | undefined): number | null {
  return typeof value === 'number' && value > 0 ? value : null
}

/** Compact so two figures fit a card: $2.9B, $237M. */
function usd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

/* Figures are TMDB-reported and not inflation-adjusted, so the labels stay
   descriptive rather than claiming to be an authoritative box-office table. */
function Money({ budget, gross, className = '' }: { budget: number | null; gross: number | null; className?: string }) {
  if (!budget && !gross) return null
  return (
    <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums ${className}`}>
      {gross != null && (
        <span className="text-label font-black uppercase tracking-widest text-foreground">
          <span className="text-muted-foreground">Worldwide</span> {usd(gross)}
        </span>
      )}
      {budget != null && (
        <span className="text-label font-black uppercase tracking-widest text-foreground/70">
          <span className="text-muted-foreground">Budget</span> {usd(budget)}
        </span>
      )}
    </div>
  )
}

/** item_rating is documented out of 5; the generator divides TMDB's /10 score. */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {/* Empty stars are a faded foreground rather than muted-foreground: in the
          light theme muted-foreground (#3E6648) sits too close to foreground
          (#173D2A) to read as empty, so 4/5 looked identical to 5/5. A single
          alpha of the same token separates correctly in both themes. */}
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden className={`text-sm ${i < Math.round(rating) ? 'text-foreground' : 'text-foreground/25'}`}>
          ★
        </span>
      ))}
      <span className="text-label font-black text-muted-foreground ml-1">{rating}/5</span>
    </div>
  )
}

export default function RankedItems({ items, sortMode = null }: { items: Item[]; sortMode?: string | null }) {
  // Money is additive, shown only where it is the thing the list was ranked on.
  // Gating on revenue rather than on "not rating" keeps popularity- and
  // recent-sorted rankings, and hand-made ones with no signature, unchanged.
  const showMoney = sortMode === 'revenue'

  const [view, setView] = useState<RankedView>(DEFAULT_VIEW)

  // Read after mount: localStorage is unavailable during SSR, so a user who
  // picked "list" sees one frame of cards. Acceptable for a layout preference.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'cards' || stored === 'list') setView(stored)
  }, [])

  function choose(next: RankedView) {
    setView(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  if (items.length === 0) return null

  const OPTIONS: { value: RankedView; label: string; Icon: typeof LayoutGrid }[] = [
    { value: 'cards', label: 'Cards', Icon: LayoutGrid },
    { value: 'list', label: 'List', Icon: Rows3 },
  ]

  return (
    // Cards need grid width (matching the other max-w-6xl sections on the page);
    // the row view keeps a reading measure.
    <div className={`${view === 'cards' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-6 md:px-10 pt-8 pb-6`}>
      {/* flex-wrap + nowrap heading: at 390px the heading was shrinking and
          breaking across two lines rather than letting the toggle drop below. */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-heading text-lg font-black uppercase tracking-widest text-foreground whitespace-nowrap">
          The Ranking
        </h2>

        <div role="group" aria-label="Ranking layout" className="flex border-[3px] border-foreground">
          {OPTIONS.map(({ value, label, Icon }, i) => {
            const active = view === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => choose(value)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 px-3 py-2 text-label font-black uppercase tracking-widest transition-colors ${
                  i > 0 ? 'border-l-[3px] border-foreground' : ''
                } ${active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}
              >
                <Icon size={14} strokeWidth={2.5} aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {view === 'cards' ? (
        // Poster grid matching ArticleCard's default variant: the rank badge sits
        // where the type badge does, the score where the rating does. No blurb —
        // the prose is what the list view is for.
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map(item => {
            const { title, poster, year, href, rating, budget, gross } = itemFields(item)
            const Wrapper: any = href ? Link : 'div'

            return (
              <Wrapper
                key={item.id}
                href={href ?? undefined}
                className="group flex flex-col brutal-card p-0 overflow-hidden hover:-translate-y-1 transition-transform h-full"
              >
                <div className="aspect-[2/3] relative overflow-hidden border-b-[3px] border-foreground bg-muted shrink-0">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center p-6">
                      <span className="font-heading text-xl font-black text-foreground/60 uppercase text-center leading-tight">
                        {title}
                      </span>
                    </div>
                  )}

                  <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-label font-black uppercase tracking-widest px-2 py-1 border-[2px] border-foreground tabular-nums">
                    {String(item.rank).padStart(2, '0')}
                  </span>

                  {rating != null && (
                    <span className="absolute top-3 right-3 bg-foreground text-background text-xs font-black px-2.5 py-1 border-[2px] border-background tabular-nums">
                      {rating}/5
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5 bg-background flex flex-col gap-2 flex-1">
                  {/* text-xl clamped mid-word in a 2-column mobile grid. */}
                  <h3 className="font-heading text-base sm:text-xl font-black uppercase leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {/* Year and money share ONE mt-auto footer. Giving each its own
                      would push only the last one down and open a gap between
                      them, and a card with neither would lose its bottom row and
                      its divider entirely. */}
                  {(year || (showMoney && (budget || gross))) && (
                    <div className="mt-auto flex flex-col gap-1 pt-1 border-t-[2px] border-foreground/10">
                      {year && (
                        <div className="text-label font-black uppercase tracking-widest text-muted-foreground">
                          {year}
                        </div>
                      )}
                      {showMoney && <Money budget={budget} gross={gross} />}
                    </div>
                  )}
                </div>
              </Wrapper>
            )
          })}
        </div>
      ) : (
        <div className="divide-y-[3px] divide-foreground border-y-[3px] border-foreground">
          {items.map(item => {
            const { title, poster, year, href, rating, budget, gross } = itemFields(item)
            const Wrapper: any = href ? Link : 'div'

            return (
              <Wrapper
                key={item.id}
                href={href ?? undefined}
                className="group flex gap-4 sm:gap-6 py-6 hover:bg-muted/30 transition-colors"
              >
                {/* Faint watermark numeral: /60 is the lowest tier that clears
                    3:1 for large text in both themes (3.49 light / 4.87 dark). */}
                <span className="font-heading text-4xl sm:text-5xl font-black text-foreground/60 w-14 sm:w-16 shrink-0 text-center pt-1">
                  {String(item.rank).padStart(2, '0')}
                </span>

                <div className="relative w-16 sm:w-20 shrink-0 aspect-[2/3] border-[3px] border-foreground overflow-hidden bg-muted">
                  {poster ? (
                    <Image src={poster} alt={title} fill sizes="80px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center p-1">
                      <span className="font-heading text-label font-black uppercase text-center text-primary-foreground leading-tight">{title}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-heading text-lg sm:text-xl font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    {year && <span className="text-label font-bold text-muted-foreground">{year}</span>}
                  </div>

                  {rating != null && <div className="mt-1.5"><Stars rating={rating} /></div>}

                  {showMoney && <Money budget={budget} gross={gross} className="mt-1.5" />}

                  {item.blurb && (
                    <p className="text-base font-medium text-foreground/80 mt-2 leading-relaxed max-w-[60ch]">{item.blurb}</p>
                  )}
                </div>
              </Wrapper>
            )
          })}
        </div>
      )}
    </div>
  )
}
