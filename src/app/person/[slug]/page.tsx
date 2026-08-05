// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { typeToRoute } from '@/lib/utils'

async function getPersonBySlug(slug: string) {
  // In a real database, we would have a `people` table.
  // For now, this acts as a robust mockup for the dynamic architecture.
  return {
    name: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
    slug,
    biography: "An acclaimed figure in the entertainment industry.",
    profile_url: null,
    movies: [
      { id: '1', title: 'The Dark Knight', poster_url: '' },
      { id: '2', title: 'Inception', poster_url: '' }
    ],
    articles: [
      { id: '1', type: 'news', title: 'New Project Announced', slug: 'new-project' }
    ]
  }
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const person = await getPersonBySlug(slug)

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start mb-16">
        <div className="w-48 h-48 bg-foreground border-[4px] border-foreground shrink-0 rounded-full overflow-hidden">
          {person.profile_url ? (
            <img src={person.profile_url} alt={person.name} className="w-full h-full object-cover grayscale" />
          ) : (
             <div className="w-full h-full flex items-center justify-center font-heading text-6xl text-background">
               {person.name.charAt(0)}
             </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-5xl md:text-7xl font-black uppercase text-foreground leading-[0.9] mb-6">{person.name}</h1>
          <h2 className="font-heading text-2xl font-black uppercase text-foreground mb-2 border-b-[4px] border-foreground pb-2">Biography</h2>
          <p className="font-bold text-foreground/80 leading-relaxed text-lg max-w-3xl">{person.biography}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <section>
            <h2 className="font-heading text-3xl font-black uppercase text-foreground mb-6 border-b-[4px] border-foreground pb-2">Filmography</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {person.movies.map(m => (
                 <Link key={m.id} href={`/movie/${m.slug || 'unknown'}`} className="block border-[3px] border-foreground hover:-translate-y-1 transition-transform group">
                   <div className="aspect-[2/3] bg-muted flex items-center justify-center p-2 text-center">
                     <span className="font-black text-xs uppercase">{m.title}</span>
                   </div>
                 </Link>
               ))}
            </div>
         </section>
         
         <section>
            <h2 className="font-heading text-3xl font-black uppercase text-foreground mb-6 border-b-[4px] border-foreground pb-2">Related Articles</h2>
            <div className="space-y-4">
              {person.articles.map(a => (
                <Link key={a.id} href={`/${typeToRoute(a.type)}/${a.slug}`} className="block brutal-card p-6 bg-secondary hover:-translate-y-1 transition-transform">
                   <span className="text-label font-black uppercase tracking-widest bg-foreground text-background px-2 py-1 mb-2 inline-block">{a.type}</span>
                   <h3 className="font-heading text-xl font-black uppercase leading-tight">{a.title}</h3>
                </Link>
              ))}
            </div>
         </section>
      </div>
    </div>
  )
}
