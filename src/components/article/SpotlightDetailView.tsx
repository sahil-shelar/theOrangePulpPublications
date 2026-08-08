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

  // ── Which sub-template ──────────────────────────────────────────────────
  // Spotlights are two different articles wearing one type. A PERSON spotlight
  // profiles a director or actor and is carried by their face and filmography.
  // A TOPIC spotlight ("The Evolution of Modern Cinema") has no subject at all
  // — it is an essay, and it wants the same cinematic treatment a review gets.
  //
  // `subject_name` is the discriminator rather than a new column, because it is
  // already exactly that in practice: the generator always writes it for a
  // person, nothing writes it for a topic, and this component already used its
  // presence to decide whether to render a portrait. A dedicated enum would
  // need a migration, a backfill of 48 rows, and an editor field that can
  // contradict the data underneath it — all to answer a question the data
  // already answers unambiguously.
  //
  // Actor vs director is NOT a third template: both are people with a
  // filmography, so they share the person layout and differ only in
  // `subject_role`, which is rendered as a badge and a fact.
  const rawSubjectName = (article as any).subject_name as string | null;
  const isPersonSpotlight = Boolean(rawSubjectName?.trim());

  const subjectName = rawSubjectName || article.title;
  const subjectRole = (article as any).subject_role;
  const pullQuote = (article as any).pull_quote;
  const works = article.spotlight_works ?? [];

  // Only a real subject photo goes in the portrait card. cover_image_url is NOT
  // an acceptable fallback here: it is a film backdrop, and a landscape still
  // stretched into a 2:3 card is not a portrait of anyone.
  const portrait = (article as any).subject_photo_url as string | null;

  // Topic spotlights fall back to the movie backdrop the way reviews do — there
  // is no person to be wrong about, so a film still is the right image.
  const coverImage = article.cover_image_url || (article as any).movies?.backdrop_url;

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

  // ProfilePage only when there is genuinely a person being profiled. A topic
  // essay declaring a schema.org Person named after its own headline was
  // asserting an entity that does not exist, so those now emit a plain Article.
  const schema = isPersonSpotlight
    ? {
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
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.seo_title || article.title,
        "description": article.seo_description || article.excerpt,
        ...(coverImage && { "image": [coverImage] }),
        "datePublished": article.published_at || article.created_at,
        "dateModified": article.updated_at || article.created_at,
        "author": [{ "@type": "Person", "name": article.authors?.name || "Editorial Team" }],
      };

  return (
    <div className="w-full bg-background min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <ReadingProgressBar />
      <ViewCounter articleId={article.id} />
      <ReaderControls />

      {/* ══ PERSON sub-template ══════════════════════════════════════════════
          Portrait sized to the block rather than to a fixed width, with the
          detail column beside it.

          Still NOT full-bleed. A subject photo is 2:3 (500x750 from TMDB); the
          old full-width treatment made this box ~2.7:1, so object-cover threw
          away most of the frame and rendered a director's face as an
          unrecognisable blur. Here the portrait column is a fixed 2:3 aspect
          that grows with the breakpoint, so the crop never gets worse than the
          source — it simply gets bigger, which is what "portrait the height of
          the hero" wants without reintroducing the crop bug.

          md:items-stretch + h-full lets the image match whatever height the
          detail column ends up being, so the two sides finish level instead of
          one leaving a slab of dead space under it. object-top because when the
          detail column IS taller, the extra height is taken off the bottom of
          the frame — a headshot survives losing its chest, not its head.

          SURFACE: on-media-surface, and the choice is load-bearing rather than
          decorative. Two previous attempts failed for opposite reasons —
          bg-muted is one step off the page in light and IDENTICAL to it in dark
          (both #0E2419), so the band read as accidental empty space; bg-card is
          pure #FFFFFF, a stark white slab against a cream page in a palette
          that has no white in it anywhere else. --on-media-surface (#12301F) is
          the token globals.css already defines for exactly this: a panel that
          must stay dark in BOTH themes, which is why it does not flip and why
          the same markup works in light and dark with no dark: variants. The
          portrait then reads as a print photo mounted on a dark board.

          Everything inside therefore uses on-media/*, NOT foreground or
          card-foreground — those flip to dark green in light mode and would be
          invisible here. That is the trap this codebase has hit before. */}
      {isPersonSpotlight ? (
        <div className="bg-on-media-surface border-b-[4px] border-foreground">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16">
            <Link href="/spotlight" prefetch={false} className="inline-flex items-center gap-2 text-on-media/60 hover:text-on-media text-label font-black uppercase tracking-widest transition-colors mb-8">
              <ArrowLeft size={14} strokeWidth={2.5} /> Spotlight
            </Link>

            <div className="flex flex-col md:flex-row md:items-stretch gap-8 md:gap-12">
              {/* Portrait is omitted rather than substituted when absent — a
                  hand-written person spotlight may have no subject_photo_url and
                  must not get a broken or misleading card. */}
              {portrait && (
                <div className="w-52 sm:w-64 md:w-72 lg:w-80 shrink-0 mx-auto md:mx-0">
                  {/* Cream border, and no offset shadow: --shadow-color is
                      --foreground, which is dark green in light mode and would
                      cast an invisible shadow onto this dark board. The border
                      is what separates the photo from the surface here. */}
                  <div className="relative aspect-[2/3] md:h-full md:aspect-auto md:min-h-[26rem] border-[3px] border-on-media/85 overflow-hidden bg-on-media/10">
                    <Image
                      src={portrait}
                      alt={subjectName}
                      fill
                      priority
                      sizes="(max-width: 768px) 16rem, 20rem"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              )}

              {/* justify-center so name and facts sit against the middle of a
                  tall portrait rather than floating at its top edge. */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] bg-accent text-accent-foreground border-accent">
                    Spotlight
                  </span>
                  {subjectRole && (
                    <span className="text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] border-on-media/40 text-on-media">
                      {subjectRole}
                    </span>
                  )}
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-on-media leading-[0.95]">
                  {subjectName}
                </h1>

                {/* The dek moves INTO the hero for people. It is the one line
                    that answers "why this person, why now", so leaving it in a
                    panel below the fold meant the hero showed a face and a
                    birthday and no reason to keep reading. Topic spotlights keep
                    it in the body panel, where there is no portrait competing
                    for the same space. */}
                {article.excerpt && (
                  <p className="mt-5 text-base sm:text-lg font-medium text-on-media/75 leading-relaxed max-w-2xl">
                    {article.excerpt}
                  </p>
                )}

                {/* Structured data, never generated prose. TMDB leaves birthday and
                    place_of_birth null for many working directors, so this list is
                    built from whatever is present and disappears entirely when
                    nothing is — which is the common case, not the edge case. */}
                {facts.length > 0 && (
                  <dl className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 border-t-[2px] border-on-media/20 pt-5">
                    {facts.map(fact => (
                      <div key={fact.label} className="flex items-baseline gap-2">
                        <dt className="text-label font-black uppercase tracking-widest text-on-media/55 shrink-0">
                          {fact.label}
                        </dt>
                        <dd className="text-meta font-bold text-on-media min-w-0">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-6 pt-4 border-t-[2px] border-on-media/20">
                  <span className="font-black uppercase tracking-widest text-label text-on-media/70">
                    {article.authors?.name || "Editorial Team"}
                  </span>
                  <span className="text-on-media/40 text-label">·</span>
                  <span className="text-label font-bold uppercase tracking-widest text-on-media/70">
                    {new Date(article.published_at || article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══ TOPIC sub-template ═════════════════════════════════════════════
           An essay with no subject gets the cinematic hero, matching
           ReviewDetailView: same heights, same object-top crop reasoning, same
           img-scrim, same on-media tokens. Deliberately a copy of that
           structure rather than a shared component — the two differ in badge,
           back-link target and meta row, and factoring out a hero that takes
           eight props to express those differences would be harder to read than
           the markup itself.

           on-media / on-media-surface, NOT foreground/background: those flip
           with the theme, and this text sits on a photo that is dark in both.
           Using a flipping token here is what once made hero titles invisible
           in dark mode. */
        <div className="relative w-full h-[55vh] md:h-[70vh] min-h-[380px] md:min-h-[460px] overflow-hidden border-b-[4px] border-foreground">
          {coverImage ? (
            <Image src={coverImage} alt={article.title} fill priority sizes="100vw" className="object-cover object-top" />
          ) : (
            /* bg-accent, not a neutral: a topic spotlight with no cover is the
               common case for older pieces, and a flat grey box reads as a
               broken image rather than a deliberate colour field. */
            <div className="absolute inset-0 bg-accent" />
          )}
          <div className="absolute inset-0 img-scrim" />

          <Link
            href="/spotlight"
            prefetch={false}
            className="absolute top-6 left-4 sm:left-8 flex items-center gap-2 text-on-media/70 hover:text-on-media text-label font-black uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2.5} /> Spotlight
          </Link>

          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 md:pb-12 max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] bg-accent text-accent-foreground border-foreground">
                Spotlight
              </span>
              {article.categories && (
                <span className="text-label font-black uppercase tracking-widest text-on-media/80 px-3 py-1.5 border-[2px] border-on-media/20">
                  {article.categories.name}
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase text-on-media leading-[0.95] max-w-4xl">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-3 text-sm sm:text-base font-medium text-on-media/80 leading-snug max-w-2xl italic">
                {article.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-4 pt-4 border-t-[1px] border-on-media/20">
              <span className="font-black uppercase tracking-widest text-label text-on-media/80">
                {article.authors?.name || "Editorial Team"}
              </span>
              <span className="text-on-media/30 text-label">·</span>
              <span className="text-label font-bold uppercase tracking-widest text-on-media/80">
                {new Date(article.published_at || article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
              </span>
              <span className="text-on-media/30 text-label">·</span>
              <span className="text-label font-bold uppercase tracking-widest text-on-media/80">
                {article.reading_time || 5} min read
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Pull quote ── */}
      {pullQuote && (
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16 text-center">
          <p className="font-heading text-2xl md:text-4xl font-black uppercase leading-tight text-foreground">
            &ldquo;{pullQuote}&rdquo;
          </p>
        </div>
      )}

      {/* ── Body + sidebar ──
          pt matters as much as pb here. This grid had bottom padding and none
          at the top, so the first line of body copy and the sidebar block both
          started hard against the hero's 4px border — the section read as
          something cut off mid-flow rather than as a new one beginning. */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pt-10 md:pt-14 pb-12 md:pb-16">
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
          {/* The "The Occasion" standfirst panel that used to sit here is gone.
              It existed because the generated dek was written to `excerpt` and
              rendered nowhere, so the sentence explaining why this subject now
              was invisible. Both sub-templates now surface it in the hero —
              beside the portrait for a person, under the headline for a topic —
              so keeping the panel printed the same sentence twice on one
              screen. The dek is still shown, just once and higher up. */}

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
