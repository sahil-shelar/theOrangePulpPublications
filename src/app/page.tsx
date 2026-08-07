// @ts-nocheck
import { getTrendingContent, getTrendingMovies, getEditorsPicks } from '@/lib/services/trending'
import { getTmdbTrendingWeek } from '@/lib/services/tmdb'
import { getCachedLatestArticles } from '@/lib/api/articles'
import { getHomeSections, sectionByKey, type HomeSection } from '@/lib/api/chrome'
import ArticleCard from '@/components/article/ArticleCard'
import HeroArticle from '@/components/article/HeroArticle'
import MovieCarousel from '@/components/movies/MovieCarousel'
import Link from 'next/link'
import { ArrowRight, Star, Newspaper, Sparkles, Trophy } from 'lucide-react'
import { typeToRoute } from '@/lib/utils'

// Icon components cannot be stored in a database, so home_sections holds the
// NAME and this maps it back. Unknown names fall through to Star rather than
// rendering nothing — a promo card with no icon still works, a crash does not.
const PROMO_ICONS: Record<string, typeof Star> = { Star, Newspaper, Sparkles, Trophy }

// Matches the listing pages — the homepage is the main entry point, so it
// should not be an hour staler than /reviews.
export const revalidate = 60

export default async function Homepage() {
  const [latestArticles, homeSections, trendingArticles, editorialMovies, editorsPicks, tmdbTrending] = await Promise.all([
    getCachedLatestArticles(7),
    getHomeSections(),
    getTrendingContent(6),
    getTrendingMovies(12),
    getEditorsPicks(3),
    getTmdbTrendingWeek(),
  ])

  const heroArticle = latestArticles[0]
  const latestGrid = latestArticles.slice(1, 4)
  const latestMore = latestArticles.slice(4, 7)

  const editorialMovieSlides = editorialMovies
    .filter((m: any) => m.slug || m.tmdb_id)
    .map((m: any) => ({
      slug: m.slug,
      tmdb_id: m.tmdb_id,
      title: m.title,
      poster_url: m.poster_url,
      release_date: m.release_date,
    }))

  return (
    <div className="w-full bg-background">

      {/* Hero */}
      {heroArticle && <HeroArticle article={heroArticle} />}

      <div className="max-w-7xl mx-auto px-6 md:px-10">

        {/* ── Most Talked This Week (TMDB) ── */}
        {tmdbTrending.length > 0 && (
          <section className="py-12 border-b-[3px] border-foreground">
            <SectionHeader section={sectionByKey(homeSections, 'most_talked')} />
            <MovieCarousel movies={tmdbTrending} />
          </section>
        )}

        {/* ── Latest ── */}
        {latestGrid.length > 0 && (
          <section className="py-14 border-b-[3px] border-foreground">
            <SectionHeader section={sectionByKey(homeSections, 'latest')} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestGrid.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
            {latestMore.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestMore.map(a => <ArticleCard key={a.id} article={a} variant="horizontal" />)}
              </div>
            )}
          </section>
        )}

        {/* ── Section Promo Row ── */}
        <section className="py-14 border-b-[3px] border-foreground">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {homeSections.filter(sec => sec.kind === 'promo').map(sec => {
              const Icon = PROMO_ICONS[sec.icon ?? ''] ?? Star
              return (
                <SectionPromo
                  key={sec.section_key}
                  href={sec.href ?? '/'}
                  color={sec.accent ?? undefined}
                  label={sec.heading}
                  desc={sec.description ?? ''}
                  icon={<Icon size={20} />}
                />
              )
            })}
          </div>
        </section>

        {/* ── Trending Articles + Editorial Movies ── */}
        <section className="py-14 border-b-[3px] border-foreground grid grid-cols-1 lg:grid-cols-12 gap-12">

          {trendingArticles.length > 0 && (
            <div className="lg:col-span-7">
              <SectionHeader section={sectionByKey(homeSections, 'trending')} />
              <div className="divide-y-[3px] divide-foreground border-y-[3px] border-foreground">
                {trendingArticles.map((art, i) => (
                  <Link
                    key={art.id}
                    href={`/${typeToRoute(art.type)}/${art.slug}`}
                    className="flex items-center gap-5 py-4 group hover:bg-muted/40 transition-colors px-2"
                  >
                    <span className="font-heading text-4xl font-black text-foreground/60 group-hover:text-primary transition-colors w-10 shrink-0 leading-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-label font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                        {art.categories?.name || art.type}
                      </div>
                      <h4 className="font-heading text-lg font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                    </div>
                    {((art as any).cover_image_url || (art as any).movies?.poster_url) ? (
                      <div className="w-16 h-12 shrink-0 border-[2px] border-foreground overflow-hidden">
                        <img
                          src={(art as any).cover_image_url || (art as any).movies.poster_url}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {editorialMovieSlides.length > 0 && (
            <div className="lg:col-span-5">
              <SectionHeader section={sectionByKey(homeSections, 'on_our_radar')} />
              <div className="grid grid-cols-3 gap-3">
                {editorialMovieSlides.slice(0, 6).map((m: any, i: number) => (
                  <Link
                    key={m.slug ?? m.tmdb_id ?? i}
                    href={m.slug ? `/movie/${m.slug}` : `/movie/tmdb/${m.tmdb_id}`}
                    className="group flex flex-col gap-1.5"
                  >
                    <div className="aspect-[2/3] border-[3px] border-foreground overflow-hidden bg-muted">
                      {m.poster_url ? (
                        <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-primary" />
                      )}
                    </div>
                    <h4 className="font-heading text-label font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {m.title}
                    </h4>
                    {m.release_date && (
                      <div className="text-label font-black uppercase tracking-widest text-muted-foreground -mt-0.5">
                        {new Date(m.release_date).getFullYear()}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Editor's Picks ── */}
        {editorsPicks.length > 0 && (
          <section className="py-14">
            <SectionHeader section={sectionByKey(homeSections, 'editors_picks')} />
            <div className="brutal-card bg-on-media-surface p-0 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-on-media/20">
                {editorsPicks.map((article) => {
                  const image = (article as any).cover_image_url || (article as any).movies?.poster_url
                  return (
                    <Link
                      key={article.id}
                      href={`/${typeToRoute(article.type)}/${article.slug}`}
                      className="group relative overflow-hidden"
                    >
                      {/* opacity-60, not 20: at 20% the poster was a ghost and the
                          bg-foreground green it sits on dominated the card. The scrim
                          below is what earns the text its contrast, so the image does
                          not also have to be dimmed into the background to get it.
                          A media surface stays behind it — image-less picks render on that. */}
                      <div className="absolute inset-0">
                        {image && <img src={image} alt={article.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-300" />}
                        <div className="absolute inset-0 img-scrim" />
                      </div>
                      <div className="relative p-7 min-h-[280px] flex flex-col justify-between">
                        <span className="text-label font-black uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1 border-[2px] border-on-media/30 self-start">
                          {article.type}
                        </span>
                        <div>
                          <h3 className="font-heading text-2xl font-black uppercase text-on-media leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-3">
                            {article.title}
                          </h3>
                          <div className="text-label font-black uppercase tracking-widest text-on-media/75">
                            {article.authors?.name || 'Editorial'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function SectionHeader({ section }: { section: HomeSection | null }) {
  // Null only happens if a key is removed from both the table and the fallback
  // list. Rendering nothing beats rendering an empty heading above real content.
  if (!section) return null
  const { heading: title, href } = section
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="font-heading text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground">
        {title}
      </h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-label font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          View All <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

function SectionPromo({ href, color, icon, label, desc, inverted }: {
  href: string; color?: string; icon: React.ReactNode; label: string; desc: string; inverted?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group border-[3px] border-foreground p-5 md:p-6 flex flex-col gap-3 hover:-translate-y-1 transition-all ${inverted ? 'bg-foreground text-background' : color ?? 'bg-background'}`}
      style={{ boxShadow: '6px 6px 0px 0px var(--foreground)' }}
    >
      <div className="opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
      <div>
        <div className="font-heading text-lg md:text-2xl font-black uppercase tracking-tight leading-tight break-words">{label}</div>
        <div className="text-label font-bold uppercase tracking-widest opacity-60 mt-1">{desc}</div>
      </div>
      <ArrowRight size={14} className="mt-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
  )
}
