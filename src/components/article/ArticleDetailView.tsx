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

const TYPE_ACCENT: Record<string, { strip: string; badge: string; tag: string; border: string }> = {
  review:    { strip: "bg-primary",    badge: "bg-primary text-foreground border-foreground",    tag: "bg-primary text-foreground",    border: "border-primary" },
  news:      { strip: "bg-secondary",  badge: "bg-secondary text-foreground border-foreground",  tag: "bg-secondary text-foreground",  border: "border-secondary" },
  spotlight: { strip: "bg-accent",     badge: "bg-accent text-foreground border-foreground",     tag: "bg-accent text-foreground",     border: "border-accent" },
  list:      { strip: "bg-foreground text-background", badge: "bg-primary text-foreground border-background/30", tag: "bg-foreground text-background", border: "border-foreground" },
};

export default async function ArticleDetailView({ article }: { article: ArticleWithRelations }) {
  const [articleTags, related] = await Promise.all([
    getCachedArticleTags(article.id),
    getCachedRelated(article.id, article.category_id, article.type, article.movie_id),
  ]);

  const coverImage = article.cover_image_url || (article as any).movies?.backdrop_url;
  const accent = TYPE_ACCENT[article.type] ?? TYPE_ACCENT.review;

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.seo_title || article.title,
    "description": article.seo_description || article.excerpt,
    "image": [article.og_image_url || article.cover_image_url || ""],
    "datePublished": article.published_at || article.created_at,
    "dateModified": article.updated_at || article.created_at,
    "author": [{
      "@type": "Person",
      "name": article.authors?.name || "Editorial Team",
      "url": `https://theorangepulp.com/author/${article.authors?.slug || ""}`,
    }],
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://theorangepulp.com/" },
      { "@type": "ListItem", "position": 2, "name": article.type.toUpperCase(), "item": `https://theorangepulp.com/${typeToRoute(article.type)}` },
      { "@type": "ListItem", "position": 3, "name": article.title },
    ],
  };

  return (
    <div className="w-full bg-background min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <ReadingProgressBar />
      <ViewCounter articleId={article.id} />
      <ReaderControls />

      {/* ── Cinematic Hero ── */}
      <div className="relative w-full h-[55vh] md:h-[75vh] overflow-hidden border-b-[4px] border-foreground">
        {/* Image */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 ${accent.strip}`} />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-foreground/10" />

        {/* Back link */}
        <Link
          href={`/${typeToRoute(article.type)}`}
          prefetch={false}
          className="absolute top-6 left-4 sm:left-8 flex items-center gap-2 text-background/70 hover:text-background text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={3} /> {typeToRoute(article.type)}
        </Link>

        {/* Rating badge (reviews only) */}
        {article.rating && (
          <div className="absolute top-6 right-4 sm:right-8 bg-primary border-[3px] border-background text-foreground font-black text-2xl md:text-4xl px-4 md:px-6 py-2 md:py-3 leading-none">
            {article.rating}<span className="text-sm md:text-lg">/5</span>
          </div>
        )}

        {/* Title + excerpt + author — all overlaid on image */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 md:pb-12 max-w-6xl mx-auto">
          {/* Type + category badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-[2px] ${accent.badge}`}>
              {article.type}
            </span>
            {article.categories && (
              <span className="text-[9px] font-black uppercase tracking-widest text-background/60 px-3 py-1.5 border-[2px] border-background/20">
                {article.categories.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase text-background leading-[0.95] max-w-4xl">
            {article.title}
          </h1>

          {/* Excerpt — small, italic, dimmed */}
          {article.excerpt && (
            <p className="mt-3 text-sm sm:text-base font-medium text-background/65 leading-snug max-w-2xl italic">
              {article.excerpt}
            </p>
          )}

          {/* Author + meta row */}
          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t-[1px] border-background/20">
            <div className="w-7 h-7 shrink-0 border-[2px] border-background/40 overflow-hidden">
              {article.authors?.avatar_url ? (
                <img src={article.authors.avatar_url} alt={article.authors.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center font-heading font-black text-xs text-foreground">
                  {(article.authors?.name || "E").charAt(0)}
                </div>
              )}
            </div>
            <Link
              href={`/author/${article.authors?.slug || ""}`}
              prefetch={false}
              className="font-black uppercase tracking-widest text-[10px] text-background/80 hover:text-background transition-colors"
            >
              {article.authors?.name || "Editorial Team"}
            </Link>
            <span className="text-background/30 text-[10px]">·</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-background/55">
              {new Date(article.published_at || article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </span>
            <span className="text-background/30 text-[10px]">·</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-background/55">{article.reading_time || 5} min read</span>
            <span className="hidden sm:inline text-background/30 text-[10px]">·</span>
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-background/55">{article.views_count ?? 0} views</span>
          </div>
        </div>
      </div>

      {/* ── Main content + sidebar ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 py-12 md:py-16">

        {/* Article body */}
        <div className="lg:col-span-8">
          <article className="prose prose-lg prose-headings:font-heading prose-headings:font-black prose-headings:uppercase prose-p:font-medium prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:border-[3px] prose-img:border-foreground prose-blockquote:border-l-[6px] prose-blockquote:border-primary prose-blockquote:not-italic prose-strong:font-black max-w-none text-foreground">
            <ReactMarkdown>{article.content || ""}</ReactMarkdown>
          </article>

          {/* Tags */}
          <div className="mt-10 flex flex-wrap gap-2">
            {articleTags && articleTags.length > 0
              ? (articleTags as any[]).map((at: any) => at.tags).filter(Boolean).map((tag: any) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    prefetch={false}
                    className={`border-[3px] border-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors ${accent.tag}`}
                  >
                    #{tag.name}
                  </Link>
                ))
              : (
                <span className={`border-[3px] border-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest ${accent.tag}`}>
                  #{article.type}
                </span>
              )
            }
          </div>

          {/* Share */}
          <ShareButtons
            title={article.title}
            accentBorder={accent.border}
            coverImageUrl={article.cover_image_url || (article as any).movies?.backdrop_url || undefined}
            rating={(article as any).rating ?? undefined}
            excerpt={article.excerpt ?? undefined}
          />

          {/* Comments */}
          <CommentsSection articleId={article.id} />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-0 bg-muted p-6 md:p-8 self-start">

          <AdSlot slotKey="sidebar-top" className="w-full mb-8" />

          {/* Related */}
          {related.length > 0 && (
            <div className="border-t-[3px] border-foreground pt-8">
              <h3 className="font-heading text-lg font-black uppercase text-foreground border-b-[3px] border-foreground pb-2 mb-0">
                You May Also Like
              </h3>
              <div className="divide-y-[3px] divide-foreground border-b-[3px] border-foreground">
                {related.map((art: any) => {
                  const img = art.cover_image_url || art.movies?.poster_url;
                  return (
                    <Link
                      key={art.id}
                      href={`/${typeToRoute(art.type)}/${art.slug}`}
                      prefetch={false}
                      className="group flex gap-3 py-4 hover:bg-muted/40 transition-colors"
                    >
                      {img ? (
                        <div className="w-16 h-12 shrink-0 border-[2px] border-foreground overflow-hidden">
                          <img src={img} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-16 h-12 shrink-0 border-[2px] border-foreground bg-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mb-0.5">{art.type}</div>
                        <h4 className="font-heading text-sm font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {art.title}
                        </h4>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Newsletter */}
          <div className="mt-8">
            <SidebarNewsletter />
          </div>
        </aside>
      </div>

      {/* Bottom ad */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <AdSlot slotKey="article-bottom-leaderboard" className="mx-auto" />
      </div>
    </div>
  );
}
