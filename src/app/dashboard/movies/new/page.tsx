import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MovieForm from '../MovieForm'

export default function NewMoviePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/dashboard/movies" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Movies
        </Link>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">Add Movie</h1>
      </div>
      <MovieForm />
    </div>
  )
}
