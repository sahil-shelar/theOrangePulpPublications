// @ts-nocheck
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MovieForm from '../../MovieForm'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: movie, error } = await supabase.from('movies').select('*').eq('id', id).single()

  if (error || !movie) notFound()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/dashboard/movies" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Movies
        </Link>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">Edit Movie</h1>
        <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest">{movie.title}</p>
      </div>
      <MovieForm initialData={movie} />
    </div>
  )
}
