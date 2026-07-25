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
import { searchTmdbMovie } from "@/lib/services/tmdb";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { typeToRoute } from "@/lib/utils";

type RankedMovie = {
  rank: number
  title: string
  poster_url?: string
  tmdb_id?: number
  slug?: string
  year?: number
  note?: string
  director?: string
}

type ParsedEntry = { rank: number; title: string; body: string }

function parseContentSections(content: string): { intro: string; entries: ParsedEntry[] } {
  const firstMatch = content.match(/^#{1,4}\s+\d+\./m)
  if (!firstMatch || firstMatch.index === undefined) return { intro: content, entries: [] }

  const intro = content.slice(0, firstMatch.index).trim()
  const listPart = content.slice(firstMatch.index)

  const parts = listPart.split(/(?=^#{1,4}\s+\d+\.)/m)
  const entries: ParsedEntry[] = []
  for (const part of parts) {
    const hm = part.match(/^#{1,4}\s+(\d+)\.\s+(.+?)[ \t]*\n/)
    if (!hm) continue
    entries.push({
      rank: parseInt(hm[1]),
      title: hm[2].trim(),
      body: part.slice(hm[0].length).trim(),
    })
  }
  return { intro, entries }
}

async function enrichWithTmdb(entries: ParsedEntry[]): Promise<(ParsedEntry & { poster_url?: string; tmdb_id?: number; year?: number })[]> {
  const results = await Promise.all(
    entries.map(async (entry) => {
      try {
        const hits = await searchTmdbMovie(entry.title)
        const hit = hits[0]
        return {
          ...entry,
          tmdb_id: hit?.id ?? undefined,
          poster_url: hit?.poster_path ? `https://image.tmdb.org/t/p/w342${hit.poster_path}` : undefined,
          year: hit?.release_date ? new Date(hit.release_date).getFullYear() : undefined,
        }
      } catch {
        return entry
      }
    })
  )
  return results
}

export default async function ListDetailView({ article }: { article: ArticleWithRelations }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const metadata = article.metadata as { ranked_movies?: RankedMovie[] } | null;
  const rankedMovies = metadata?.ranked_movies ?? [];

  const { intro, entries } = rankedMovies.length === 0
    ? parseContentSections(article.content || "")
    : { intro: "", entries: [] };

  const [{ data: initialComments }, { data: articleTags }, related, enrichedEntries] = await Promise.all([
    supabase.from("comments").select("*").eq("article_id", article.id).order("created_at", { ascending: false }),
    supabase.from("article_tags").select("tags(id, name, slug)").eq("article_id", article.id),
    getRecommendedArticles(article.id, 4, {
      category_id: article.category_id,
      type: article.type,
      movie_id: article.movie_id,
    }),
    entries.length > 0 ? enrichWithTmdb(entries) : Promise.resolve([]),
  ]);

  // Merge: metadata poster cards OR tmdb-enriched content cards
  const movieCards: (RankedMovie | (ParsedEntry & { poster_url?: string; tmdb_id?: number; year?: number }))[] =
    rankedMovies.length > 0 ? rankedMovies : enrichedEntries;

  return (
    <div className="w-full bg-background min-h-screen">
      <ReadingProgressBar />
      <ViewCounter articleId={article.id} />
      <ReaderControls />

      {/* Cinematic hero */}
      <div className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden border-b-[4px] border-foreground">
        {article.cover_image_url ? (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-foreground" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-foreground/10" />

        <Link
          href="/lists"
          className="absolute top-6 left-4 sm:left-8 flex items-center gap-2 text-background/70 hover:text-background text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Lists
        </Link>

        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 md:pb-12 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-[2px] bg-primary text-foreground border-foreground">
              List
            </span>
            {article.categories && (
              <span className="text-[9px] font-black uppercase tracking-widest text-background/60 px-3 py-1.5 border-[2px] border-background/20">
                {article.categories.name}
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase text-background leading-[0.95] max-w-4xl">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-3 text-sm sm:text-base font-medium text-background/65 leading-snug max-w-2xl italic">
              {article.excerpt}
            </p>
          )}

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
          </div>
        </div>
      </div>

      {/* Intro prose (above the grid) */}
      {intro && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-2">
          <div className="prose prose-base prose-p:font-medium prose-p:text-foreground/70 prose-em:text-foreground/55 prose-strong:font-black max-w-2xl">
            <ReactMarkdown>{intro}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Movie poster card grid */}
      {movieCards.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {movieCards.map((movie: any) => {
              const href = movie.slug
                ? `/movie/${movie.slug}`
                : movie.tmdb_id
                ? `/movie/tmdb/${movie.tmdb_id}`
                : null;
              const Wrapper = href ? Link : "div";
              return (
                <Wrapper
                  key={movie.rank}
                  href={href ?? undefined}
                  className="group flex flex-col gap-2"
                >
                  <div className="relative aspect-[2/3] border-[3px] border-foreground overflow-hidden bg-muted">
                    <div className="absolute top-0 left-0 z-10 bg-foreground text-background font-heading font-black text-xs px-2 py-1 leading-none">
                      {String(movie.rank).padStart(2, "0")}
                    </div>
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center p-3">
                        <span className="font-heading text-xs font-black uppercase text-center text-foreground/60 leading-tight">
                          {movie.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-black uppercase leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {movie.title}
                    </h3>
                    {movie.year && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-0.5">
                        {movie.year}
                      </div>
                    )}
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      )}

      {/* Fall-through: plain prose if nothing parsed */}
      {movieCards.length === 0 && article.content && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-4">
          <article className="prose prose-lg prose-headings:font-heading prose-headings:font-black prose-headings:uppercase prose-p:font-medium prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:border-[3px] prose-img:border-foreground prose-blockquote:border-l-[6px] prose-blockquote:border-primary prose-blockquote:not-italic prose-strong:font-black max-w-none text-foreground">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </article>
        </div>
      )}

      {/* Tags + share + comments + sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 py-10 md:py-14">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            {articleTags && articleTags.length > 0
              ? articleTags.map((at: any) => at.tags).filter(Boolean).map((tag: any) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="border-[3px] border-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors bg-primary text-foreground"
                  >
                    #{tag.name}
                  </Link>
                ))
              : (
                <span className="border-[3px] border-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-primary text-foreground">#list</span>
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
                    <Link
                      key={art.id}
                      href={`/${typeToRoute(art.type)}/${art.slug}`}
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
