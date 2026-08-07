// @ts-nocheck
import Link from 'next/link'
import { Play, ExternalLink } from 'lucide-react'
import { typeToRoute } from '@/lib/utils'

type CastMember = { name: string; character?: string; profile?: string }

export type MovieDetailProps = {
  title: string
  tagline?: string
  synopsis?: string
  poster_url?: string | null
  backdrop_url?: string | null
  release_date?: string | null
  runtime?: number | null
  director?: string | null
  certification?: string | null
  trailer_url?: string | null
  genres?: string[]
  cast?: CastMember[]
  budget?: number | null
  revenue?: number | null
  streaming_providers?: string[]
  relatedArticles?: { id: string; title: string; slug: string; type: string }[]
}

export default function MovieDetail({
  title,
  tagline,
  synopsis,
  poster_url,
  backdrop_url,
  release_date,
  runtime,
  director,
  certification,
  trailer_url,
  genres = [],
  cast = [],
  budget,
  revenue,
  streaming_providers = [],
  relatedArticles = [],
}: MovieDetailProps) {
  const year = release_date ? new Date(release_date).getFullYear() : null

  return (
    <div className="w-full bg-background min-h-screen">

      {/* ── Backdrop ── */}
      {/* Hard bottom edge, matching every other hero on the site. This used to
          fade into the page instead, but any fade long enough to read as a fade
          also lays a pale wash over the lower third of the artwork -- which is
          the whole problem it was meant to solve. A brutalist cut keeps the
          image intact end to end, and the poster straddling the border reads as
          deliberate rather than as something emerging from mush. */}
      <div className="relative w-full h-[42vh] md:h-[55vh] bg-foreground overflow-hidden border-b-[4px] border-foreground">
        {backdrop_url ? (
          <img
            src={backdrop_url}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : null}
      </div>

      {/* ── Poster + Title row ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">

          {/* Poster — overlaps backdrop */}
          <div className="w-36 md:w-52 shrink-0 aspect-[2/3] border-[4px] border-foreground bg-muted overflow-hidden -mt-24 md:-mt-32">
            {poster_url ? (
              <img src={poster_url} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center p-4">
                <span className="font-heading text-sm font-black uppercase text-center text-muted-foreground leading-tight">{title}</span>
              </div>
            )}
          </div>

          {/* Title + meta — stays in content area */}
          <div className="flex-1 min-w-0 pt-6">
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-black uppercase text-foreground leading-[0.9] tracking-tight">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-label font-black uppercase tracking-widest text-muted-foreground">
              {year && <span>{year}</span>}
              {runtime && <><span className="text-muted-foreground">·</span><span>{runtime} min</span></>}
              {director && <><span className="text-muted-foreground">·</span><span>Dir. {director}</span></>}
              {certification && certification !== 'NR' && <><span className="text-muted-foreground">·</span><span className="border-[1px] border-foreground/40 px-1.5 py-0.5">{certification}</span></>}
            </div>
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {genres.map(g => (
                  <span key={g} className="text-label font-black uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 border-[2px] border-foreground">
                    {g}
                  </span>
                ))}
              </div>
            )}
            {tagline && (
              <p className="mt-3 text-sm font-black uppercase tracking-widest text-muted-foreground italic">{tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Main */}
        <div className="lg:col-span-2 space-y-10">

          {synopsis && (
            <section>
              <h2 className="font-heading text-2xl font-black uppercase text-foreground mb-3 border-b-[3px] border-foreground pb-2">Synopsis</h2>
              {/* Panelled rather than bare: this was the only section in the column
                  without a surface of its own, next to a Cast grid of bordered
                  cards and a bordered Trailer button, so it read as unstyled.
                  Same border + hard shadow language as those.

                  bg-card / text-card-foreground is the theme-correct pair -- both
                  flip together (white/green then green/cream), so the panel keeps
                  its contrast either way. Was foreground/75, which sat lighter
                  than the sidebar panels beside it. */}
              <div className="brutal-panel shadow-hard-lg p-6 sm:p-8">
                <p className="text-base sm:text-lg font-medium leading-relaxed text-card-foreground
                              first-letter:font-heading first-letter:font-black first-letter:text-6xl
                              first-letter:float-left first-letter:leading-[0.82]
                              first-letter:mr-3 first-letter:mt-1">
                  {synopsis}
                </p>
              </div>
            </section>
          )}

          {trailer_url && (
            <section>
              <h2 className="font-heading text-2xl font-black uppercase text-foreground mb-3 border-b-[3px] border-foreground pb-2">Trailer</h2>
              <a
                href={trailer_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 bg-foreground text-background px-6 py-4 border-[3px] border-foreground w-fit hover:-translate-y-0.5 transition-transform font-black uppercase tracking-widest text-sm"
              >
                <Play size={16} fill="currentColor" />
                Watch Trailer
                <ExternalLink size={14} className="opacity-50" />
              </a>
            </section>
          )}

          {cast.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-black uppercase text-foreground mb-4 border-b-[3px] border-foreground pb-2">Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cast.slice(0, 6).map(c => (
                  <div key={c.name} className="p-3 flex gap-3 items-center bg-muted border-[3px] border-foreground" style={{boxShadow:'4px 4px 0px 0px var(--foreground)'}}>
                    <div className="w-10 h-10 shrink-0 bg-muted border-[2px] border-foreground overflow-hidden">
                      {c.profile ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${c.profile}`}
                          className="w-full h-full object-cover grayscale"
                          alt={c.name}
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-label uppercase tracking-wide leading-tight truncate">{c.name}</div>
                      {c.character && (
                        <div className="font-bold text-label text-muted-foreground truncate">{c.character}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          <div className="p-5 bg-primary border-[3px] border-foreground" style={{boxShadow:'6px 6px 0px 0px var(--foreground)'}}>
            <h3 className="font-heading text-sm font-black uppercase text-foreground mb-3 border-b-[2px] border-foreground pb-2 tracking-widest">
              Where To Watch
            </h3>
            {streaming_providers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {streaming_providers.map(p => (
                  <span key={p} className="text-label font-black uppercase tracking-widest px-3 py-1 bg-foreground text-background">{p}</span>
                ))}
              </div>
            ) : (
              <p className="text-label font-bold text-muted-foreground uppercase tracking-widest">Not currently streaming</p>
            )}
          </div>

          {(budget || revenue) ? (
            <div className="p-5 bg-secondary border-[3px] border-foreground" style={{boxShadow:'6px 6px 0px 0px var(--foreground)'}}>
              <h3 className="font-heading text-sm font-black uppercase text-foreground mb-3 border-b-[2px] border-foreground pb-2 tracking-widest">
                Box Office
              </h3>
              <div className="space-y-3">
                {budget ? (
                  <div className="flex justify-between items-center">
                    <span className="text-label font-black uppercase tracking-widest text-muted-foreground">Budget</span>
                    <span className="font-black text-sm">${(budget / 1_000_000).toFixed(0)}M</span>
                  </div>
                ) : null}
                {revenue ? (
                  <div className="flex justify-between items-center border-t-[2px] border-foreground/10 pt-3">
                    <span className="text-label font-black uppercase tracking-widest text-muted-foreground">Worldwide</span>
                    <span className="font-black text-sm">${(revenue / 1_000_000).toFixed(0)}M</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {relatedArticles.length > 0 && (
            <div className="p-5 bg-accent border-[3px] border-foreground" style={{boxShadow:'6px 6px 0px 0px var(--foreground)'}}>
              <h3 className="font-heading text-sm font-black uppercase text-foreground mb-3 border-b-[2px] border-foreground pb-2 tracking-widest">
                Our Coverage
              </h3>
              <div className="space-y-2">
                {relatedArticles.map(art => (
                  <Link
                    key={art.id}
                    href={`/${typeToRoute(art.type)}/${art.slug}`}
                    className="block p-3 bg-background border-[3px] border-foreground hover:-translate-y-0.5 transition-transform"
                    style={{boxShadow:'4px 4px 0px 0px var(--foreground)'}}
                  >
                    <span className="text-label font-black uppercase tracking-widest bg-primary px-2 py-0.5 mb-1.5 inline-block border-[2px] border-foreground">
                      {art.type}
                    </span>
                    <h4 className="font-black text-xs uppercase leading-tight line-clamp-2">{art.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
