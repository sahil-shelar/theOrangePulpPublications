// @ts-nocheck
import { ArticleWithRelations } from "@/types/models";
import Link from "next/link";
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
  const portrait = (article as any).subject_photo_url || article.cover_image_url;
  const pullQuote = (article as any).pull_quote;
  const works = article.spotlight_works ?? [];

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

      {/* ── Magazine hero: full-bleed portrait + name overlay ── */}
      <div className="relative w-full h-[46vh] md:h-[62vh] overflow-hidden border-b-[4px] border-foreground">
        {portrait ? (
          <img src={portrait} alt={subjectName} className="absolute inset-0 w-full h-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 bg-foreground" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/25 to-foreground/10" />

        <Link href="/spotlight" prefetch={false} className="absolute top-6 left-4 sm:left-8 flex items-center gap-2 text-background/70 hover:text-background text-[10px] font-black uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} strokeWidth={3} /> Spotlight
        </Link>

        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 md:pb-10 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-[2px] bg-accent text-foreground border-foreground">
              Spotlight
            </span>
            {subjectRole && (
              <span className="text-[9px] font-black uppercase tracking-widest text-background/60 px-3 py-1.5 border-[2px] border-background/20">
                {subjectRole}
              </span>
            )}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase text-background leading-[0.95] max-w-4xl">
            {subjectName}
          </h1>
          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t-[1px] border-background/20">
            <span className="font-black uppercase tracking-widest text-[10px] text-background/80">
              {article.authors?.name || "Editorial Team"}
            </span>
            <span className="text-background/30 text-[10px]">·</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-background/55">
              {new Date(article.published_at || article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Pull quote ── */}
      {pullQuote && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 md:py-16 text-center">
          <p className="font-heading text-2xl md:text-4xl font-black uppercase leading-tight text-foreground">
            &ldquo;{pullQuote}&rdquo;
          </p>
        </div>
      )}

      {/* ── Body + sidebar ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pb-12 md:pb-16">
        <div className="lg:col-span-8">
          {article.content && (
            <article className="prose prose-lg prose-headings:font-heading prose-headings:font-black prose-headings:uppercase prose-p:font-medium prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:border-[3px] prose-img:border-foreground prose-blockquote:border-l-[6px] prose-blockquote:border-primary prose-blockquote:not-italic prose-strong:font-black max-w-none text-foreground">
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
                          <img src={poster} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-accent flex items-center justify-center p-3">
                            <span className="font-heading text-xs font-black uppercase text-center text-muted-foreground leading-tight">{title}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-heading text-sm font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">{title}</h3>
                        {work.note && <div className="text-[10px] font-bold text-muted-foreground mt-0.5 line-clamp-2">{work.note}</div>}
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
                    className="border-[3px] border-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors bg-accent text-foreground">
                    #{tag.name}
                  </Link>
                ))
              : (
                <span className="border-[3px] border-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-accent text-foreground">#spotlight</span>
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
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{art.type}</div>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <AdSlot slotKey="article-bottom-leaderboard" className="mx-auto" />
      </div>
    </div>
  );
}
