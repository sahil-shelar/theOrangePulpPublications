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
import RankedItems from "./RankedItems";
import { getRecommendedArticles } from "@/lib/services/recommendations";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { typeToRoute } from "@/lib/utils";

export default async function ListDetailView({ article }: { article: ArticleWithRelations }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: initialComments }, { data: articleTags }, related] = await Promise.all([
    supabase.from("comments").select("*").eq("article_id", article.id).order("created_at", { ascending: false }),
    supabase.from("article_tags").select("tags(id, name, slug)").eq("article_id", article.id),
    getRecommendedArticles(article.id, 4, {
      category_id: article.category_id,
      type: article.type,
      movie_id: article.movie_id,
    }),
  ]);

  const items = (article.list_items ?? []).slice().sort((a: any, b: any) => a.rank - b.rank);

  return (
    <div className="w-full bg-background min-h-screen">
      <ReadingProgressBar />
      <ViewCounter articleId={article.id} />
      <ReaderControls />

      {/* Cinematic hero */}
      <div className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden border-b-[4px] border-foreground">
        {article.cover_image_url ? (
          <Image src={article.cover_image_url} alt={article.title} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-foreground" />
        )}
        <div className="absolute inset-0 img-scrim" />

        <Link href="/lists" className="absolute top-6 left-4 sm:left-8 flex items-center gap-2 text-on-media/70 hover:text-on-media text-label font-black uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} strokeWidth={2.5} /> Lists
        </Link>

        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 md:pb-12 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-label font-black uppercase tracking-widest px-3 py-1.5 border-[2px] bg-primary text-primary-foreground border-foreground">
              List
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
            <div className="w-7 h-7 shrink-0 border-[2px] border-on-media/40 overflow-hidden">
              {article.authors?.avatar_url ? (
                <img src={article.authors.avatar_url} alt={article.authors.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center font-heading font-black text-xs text-foreground">
                  {(article.authors?.name || "E").charAt(0)}
                </div>
              )}
            </div>
            <Link href={`/author/${article.authors?.slug || ""}`} className="font-black uppercase tracking-widest text-label text-on-media/80 hover:text-on-media transition-colors">
              {article.authors?.name || "Editorial Team"}
            </Link>
            <span className="text-on-media/30 text-label">·</span>
            <span className="text-label font-bold uppercase tracking-widest text-on-media/80">
              {new Date(article.published_at || article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </span>
            <span className="text-on-media/30 text-label">·</span>
            <span className="text-label font-bold uppercase tracking-widest text-on-media/80">{article.reading_time || 5} min read</span>
          </div>
        </div>
      </div>

      {/* Intro prose */}
      {article.content && (
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-10 pb-2">
          <div className="prose prose-base prose-p:font-medium prose-p:text-foreground/70 prose-em:text-muted-foreground prose-strong:font-black max-w-2xl">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Ranked items — layout switch lives in the client component */}
      <RankedItems items={items} />

      {/* Tags + share + comments + sidebar */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 py-10 md:py-14">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            {articleTags && articleTags.length > 0
              ? articleTags.map((at: any) => at.tags).filter(Boolean).map((tag: any) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`}
                    className="border-[3px] border-foreground px-4 py-2 text-label font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors bg-primary text-primary-foreground">
                    #{tag.name}
                  </Link>
                ))
              : (
                <span className="border-[3px] border-foreground px-4 py-2 text-label font-black uppercase tracking-widest bg-primary text-primary-foreground">#list</span>
              )
            }
          </div>

          <ShareButtons title={article.title} accentBorder="border-primary" />
          <CommentsSection articleId={article.id} initialComments={initialComments || []} user={user} />
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
                    <Link key={art.id} href={`/${typeToRoute(art.type)}/${art.slug}`} className="group flex gap-3 py-4 hover:bg-muted/40 transition-colors">
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
