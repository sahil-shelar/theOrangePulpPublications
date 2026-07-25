import { getMovies } from '@/lib/api/taxonomy'
import Link from 'next/link'
import { Plus, Edit, Film } from 'lucide-react'
import MovieDeleteButton from '@/components/dashboard/MovieDeleteButton'

export default async function MoviesDashboardPage() {
  const movies = await getMovies()

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-0.5">Content</p>
          <h1 className="font-heading text-4xl font-black uppercase text-foreground">Movies</h1>
        </div>
        <Link href="/dashboard/movies/new" className="brutal-button px-5 py-3 flex items-center justify-center gap-2 text-xs">
          <Plus size={16} /> Add Movie
        </Link>
      </div>

      {movies.length === 0 ? (
        <div className="brutal-card bg-muted p-12 text-center text-xs font-bold uppercase tracking-widest text-foreground/40">
          No movies in the database yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {movies.map((movie: any) => (
            <div key={movie.id} className="brutal-card p-0 bg-background flex flex-col overflow-hidden group">
              {/* Poster */}
              <div className="w-full aspect-[2/3] border-b-[3px] border-foreground bg-muted overflow-hidden relative">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-foreground/30">
                    <Film size={28} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">{movie.title}</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <Link
                    href={`/dashboard/movies/${movie.id}/edit`}
                    className="w-full bg-primary text-foreground font-black text-[9px] uppercase tracking-widest px-3 py-2 border-[2px] border-foreground text-center hover:-translate-y-0.5 transition-transform"
                  >
                    <Edit size={12} className="inline mr-1" /> Edit
                  </Link>
                  <MovieDeleteButton id={movie.id} />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-heading text-sm font-black uppercase text-foreground truncate leading-tight">
                  {movie.title}
                </h3>
                <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest mt-0.5 truncate">
                  {movie.release_year || movie.director || '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
