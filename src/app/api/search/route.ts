import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/api/articles";
import { createPublicClient } from "@/lib/supabase/public";

async function searchMovies(query: string, limit = 4) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('movies')
    .select('id, title, slug, tmdb_id, poster_url')
    .ilike('title', `%${query}%`)
    .limit(limit)
  return (data ?? [])
    .filter((m: any) => m.slug || m.tmdb_id)
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      type: 'movie',
      slug: m.slug ?? `tmdb/${m.tmdb_id}`,
      cover_image_url: m.poster_url,
    }))
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const [articles, movies] = await Promise.all([
    searchArticles(q, 8),
    searchMovies(q, 4),
  ]);

  return NextResponse.json([...movies, ...articles]);
}
