// @ts-nocheck
import { ArticleWithRelations } from "@/types/models";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import AdSlot from "@/components/ads/AdSlot";
import ViewCounter from "./ViewCounter";
import ReadingProgressBar from "./ReadingProgressBar";
import ReaderControls from "./ReaderControls";
import CommentsSection from "./CommentsSection";
import ShareButtons from "./ShareButtons";
import SidebarNewsletter from "./SidebarNewsletter";
import { getRecommendedArticles } from "@/lib/services/recommendations";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import { ArrowLeft } from "lucide-react";
import { typeToRoute } from "@/lib/utils";

const getCachedArticleTags = unstable_cache(
  async (articleId: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase.from("article_tags").select("tags(id, name, slug)").eq("article_id", articleId)
    return data ?? []
  },
  ['article-tags'],
  { revalidate: 300, tags: ['articles'] }
)

const getCachedRelated = unstable_cache(
  async (articleId: string, categoryId: string | null, type: string, movieId: string | null) => {
    return getRecommendedArticles(articleId, 4, { category_id: categoryId, type, movie_id: movieId })
  },
  ['article-related'],
  { revalidate: 300, tags: ['articles'] }
)

export default async function SpotlightDetailView({ article }: { article: ArticleWithRelations }) {
  const [articleTags, related] = await Promise.all([
    getCachedArticleTags(article.id),
    getCachedRelated(article.id, article.category_id, article.type, article.movie_id),
  ]);

  const subjectName = (article as any).subject_name || article.title;
  const subjectRole = (article as any).subject_role;
  const pullQuote = (article as any).pull_quote;
  const works = article.spotlight_works ?? [];

  // Only a real subject photo goes in the portrait card. cover_image_url is NOT
  // an acceptable fallback here: it is a film backdrop, and a landscape still
  // stretched into a 2:3 card is not a portrait of anyone.
  const portrait = (article as any).subject_photo_url as string | null;

  const birthday = (article as any).subject_birthday as string | null;
  const birthplace = (article as any).subject_birthplace as string | null;

  // Career span comes from the works already on the page rather than another
  // field, so it is always consistent with what is rendered below.
  const workYears = works
    .map((w: any) => w.movies?.release_year)
    .filter((y: any): y is number => typeof y === "number");
  const activeFrom = workYears.length ? Math.min(...workYears) : null;

  const facts: { label: string; value: string }[] = [
    subjectRole ? { label: "Role", value: subjectRole } : null,
    birthday
      ? {
          label: "Born",
          value: new Date(birthday).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
          }),
        }
      : null,
    birthplace ? { label: "From", value: birthplace } : null,
    activeFrom ? { label: "On record since", value: String(activeFrom) } : null,
    works.length ? { label: "Works listed", value: String(works.length) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": subjectName,
      ...(subjectRole && { "jobTitle": subjectRole }),
      ...(portrait && { "image": portrait }),
    },
    "datePublished": article.published_at || article.created_at,
    "author": [{ "@type": "Person", "name": article.authors?.name || "Editorial Team" }],
  };

  return (
    <div className="w-full bg-background min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <ReadingProgressBar />
      <ViewCounter articleId={article.id} />
      <ReaderControls />

      {/* ── Subject header: a bordered card holding portrait + facts ──
          NOT a full-bleed portrait. A subject photo is 2:3 (500x750 from TMDB)
          and this block was ~2.7:1 at a normal window, so object-cover showed
          about a quarter of the image height magnified 3x — the reason a
          director's face rendered as an unrecognisable dark blur. A contained
          card lets the portrait keep its own aspect.

          Also not the MovieDetail backdrop treatment: putting the new release's
          backdrop full-bleed behind the subject makes the film the subject, and
          this piece is about the person. cover_image_url still earns its keep on
          listing cards; it just does not belong here.

          Previously the full section width was filled with bg-muted, a colour
          only one step off the page background (#E5DCCA vs #F5EFE4 in light,
          and identical to it in dark — --muted and --background render the same
          there). Close enough to invisible that the band read as stray empty
          space rather than a deliberate panel, especially below the text
          column: with items-start (the flex default) the row's height is set
          by the taller portrait, so all of the leftover space collects under
          the shorter text block instead of being shared. A bordered
          brutal-panel gives the section a real edge in both themes, and
          sm:items-center centers portrait and text against each other so that
          leftover height splits top and bottom instead of pooling on one
          side. */}
      <div className="bg-background border-b-[4px] border-foreground">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">
          <Link href="/spotlight" prefetch={false} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-label font-black uppercase tracking-widest transition-colors mb-6">
            <ArrowLeft size={14} strokeWidth={2.5} /> Spotlight
          </Link>

          <div className="brutal-panel shadow-hard-lg p-6 sm:p-8 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-10">
              {/* Portrait is omitted rather than substituted when absent — the one
                  hand-written spotlight has no subject_photo_url and must not get a
                  broken or misleading card. Centered on mobile (mx-auto) since a
                  fixed-width block in a stacked column otherwise pins to the left
                  edge under a headline that wraps full-width. */}
              {portrait && (
                <div className="w-40 sm:w-48 md:w-56 shrink-0 mx-auto sm:mx-0">
                  {/* shadow-hard-sm, not -lg: the portrait now sits inside an
                      already-shadowed panel, and stacking two large offset
                      shadows reads as visual noise rather than depth. bg-muted
                      as the loading/fallback fill so it doesn't blend into the
                      bg-card panel behind it before the image paints. */}
                  <div className="relative aspect-[2/3] border-[3px] border-foreground shadow-hard-sm overflow-hidden bg-muted">
                    <Image src={portrait} alt={subjectName} fill priority sizes="224px" className="object-cover" />
                  </div>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] bg-accent text-accent-foreground border-foreground">
                    Spotlight
                  </span>
                  {subjectRole && (
                    <span className="text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] border-foreground text-foreground">
                      {subjectRole}
                    </span>
                  )}
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl font-black uppercase text-foreground leading-[0.95]">
                  {subjectName}
                </h1>

                {/* Structured data, never generated prose. TMDB leaves birthday and
                    place_of_birth null for many working directors, so this list is
                    built from whatever is present and disappears entirely when
                    nothing is — which is the common case, not the edge case. */}
                {facts.length > 0 && (
                  <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 border-t-[2px] border-foreground/15 pt-4 max-w-xl">
                    {facts.map(fact => (
                      <div key={fact.label} className="flex items-baseline gap-2">
                        <dt className="text-label font-black uppercase tracking-widest text-muted-foreground shrink-0">
                          {fact.label}
                        </dt>
                        <dd className="text-meta font-bold text-foreground min-w-0">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-5 pt-4 border-t-[2px] border-foreground/15">
                  <span className="font-black uppercase tracking-widest text-label text-muted-foreground">
                    {article.authors?.name || "Editorial Team"}
                  </span>
                  <span className="text-muted-foreground text-label">·</span>
                  <span className="text-label font-bold uppercase tracking-widest text-muted-foreground">
                    {new Date(article.published_at || article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pull quote ── */}
      {pullQuote && (
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16 text-center">
          <p className="font-heading text-2xl md:text-4xl font-black uppercase leading-tight text-foreground">
            &ldquo;{pullQuote}&rdquo;
          </p>
        </div>
      )}

      {/* ── Body + sidebar ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pb-12 md:pb-16">
        <div className="lg:col-span-8">
          {/* The dek was generated on every spotlight and rendered nowhere — the
              generator writes it to `excerpt`, which this view never read, so the
              framing sentence explaining why this subject now was invisible.

              Same panel as the list standfirst: bg-secondary with pinned dark
              text, because the pastels are light in BOTH themes while
              foreground/card-foreground flip, and a theme-following token here
              would put dark text on a dark panel. Border set explicitly rather
              than via brutal-panel, which applies bg-card from @layer utilities
              and would beat the fill on source order. */}
          {article.excerpt && (
            <div className="border-[3px] border-foreground bg-secondary shadow-hard-lg px-6 py-6 sm:px-8 sm:py-7 mb-10">
              <span className="inline-block bg-on-media-surface text-on-media text-label font-black uppercase tracking-widest px-2.5 py-1 mb-4">
                The Occasion
              </span>
              <p className="font-heading uppercase font-black text-base sm:text-lg leading-[1.35] text-primary-foreground">
                {article.excerpt}
              </p>
            </div>
          )}

          {article.content && (
            <article className="prose prose-lg prose-headings:font-heading prose-headings:font-black prose-headings:uppercase prose-p:font-medium prose-img:border-[3px] prose-img:border-foreground prose-blockquote:border-l-[6px] prose-blockquote:border-primary prose-blockquote:not-italic prose-strong:font-black max-w-none text-foreground">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </article>
          )}

          {/* Notable works grid */}
          {works.length > 0 && (
            <div className="mt-12">
              <h2 className="font-heading text-2xl font-black uppercase text-foreground border-b-[3px] border-foreground pb-2 mb-6">
                Notable Works
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {works.map((work: any) => {
                  const title = work.movies?.title || work.custom_title || 'Untitled';
                  const poster = work.movies?.poster_url;
                  const href = work.movies?.slug ? `/movie/${work.movies.slug}` : null;
                  const Wrapper = href ? Link : 'div';
                  return (
                    <Wrapper key={work.id} href={href ?? undefined} className="group flex flex-col gap-2">
                      <div className="relative aspect-[2/3] border-[3px] border-foreground overflow-hidden bg-muted">
                        {poster ? (
                          <Image src={poster} alt={title} fill sizes="(max-width: 768px) 50vw, 200px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-accent flex items-center justify-center p-3">
                            <span className="font-heading text-xs font-black uppercase text-center text-muted-foreground leading-tight">{title}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-heading text-sm font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">{title}</h3>
                        {work.note && <div className="text-meta font-medium text-muted-foreground mt-1 leading-snug line-clamp-3">{work.note}</div>}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-2">
            {articleTags && articleTags.length > 0
              ? (articleTags as any[]).map((at: any) => at.tags).filter(Boolean).map((tag: any) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`} prefetch={false}
                    className="border-[3px] border-foreground px-4 py-2 text-label font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors bg-accent text-accent-foreground">
                    #{tag.name}
                  </Link>
                ))
              : (
                <span className="border-[3px] border-foreground px-4 py-2 text-label font-black uppercase tracking-widest bg-accent text-accent-foreground">#spotlight</span>
              )
            }
          </div>

          <ShareButtons title={article.title} accentBorder="border-accent" coverImageUrl={portrait || undefined} excerpt={article.excerpt ?? undefined} />
          <CommentsSection articleId={article.id} />
        </div>

        <aside className="lg:col-span-4 space-y-0 bg-muted p-6 md:p-8 self-start">
          <AdSlot slotKey="sidebar-top" className="w-full mb-8" />

          {related.length > 0 && (
            <div className="border-t-[3px] border-foreground pt-8">
              <h3 className="font-heading text-lg font-black uppercase text-foreground border-b-[3px] border-foreground pb-2 mb-0">
                You May Also Like
              </h3>
              <div className="divide-y-[3px] divide-foreground border-b-[3px] border-foreground">
                {related.map((art: any) => {
                  const img = art.cover_image_url || art.movies?.poster_url;
                  return (
                    <Link key={art.id} href={`/${typeToRoute(art.type)}/${art.slug}`} prefetch={false} className="group flex gap-3 py-4 hover:bg-muted/40 transition-colors">
                      {img ? (
                        <div className="w-16 h-12 shrink-0 border-[2px] border-foreground overflow-hidden">
                          <img src={img} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-16 h-12 shrink-0 border-[2px] border-foreground bg-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-label font-black uppercase tracking-widest text-muted-foreground mb-0.5">{art.type}</div>
                        <h4 className="font-heading text-sm font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">{art.title}</h4>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8">
            <SidebarNewsletter />
          </div>
        </aside>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 pb-16">
        <AdSlot slotKey="article-bottom-leaderboard" className="mx-auto" />
      </div>
    </div>
  );
}
