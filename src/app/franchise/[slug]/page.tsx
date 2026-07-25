import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// Note: Future versions will query the `franchises` table
async function getFranchiseBySlug(slug: string) {
  return {
    name: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') + ' Universe',
    slug,
    total_box_office: 29000000000,
    movies: [
      { id: '1', title: 'Phase One', release_date: '2008-05-02' },
      { id: '2', title: 'Phase Two', release_date: '2012-05-04' }
    ]
  }
}

export default async function FranchisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const franchise = await getFranchiseBySlug(slug)

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <div className="brutal-card bg-primary p-12 mb-12">
         <h1 className="font-heading text-5xl md:text-8xl font-black uppercase text-foreground leading-[0.9] text-center">{franchise.name}</h1>
         <div className="flex justify-center mt-6">
            <span className="bg-background text-foreground font-black text-sm uppercase tracking-widest px-6 py-2 border-[3px] border-foreground">
              Total Box Office: ${(franchise.total_box_office / 1000000000).toFixed(2)}B
            </span>
         </div>
      </div>

      <section>
        <h2 className="font-heading text-3xl font-black uppercase text-foreground mb-6 border-b-[4px] border-foreground pb-2">Timeline</h2>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-foreground">
           {franchise.movies.map((m, i) => (
             <div key={m.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-[4px] border-foreground bg-background text-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[2px_2px_0_0_#E2BFCA] z-10 font-black text-xs">
                  {i + 1}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] brutal-card p-4 bg-background group-hover:-translate-y-1 transition-transform">
                   <div className="font-black text-xs uppercase tracking-widest text-primary mb-1">{m.release_date.split('-')[0]}</div>
                   <h3 className="font-heading text-xl font-black uppercase text-foreground leading-tight">{m.title}</h3>
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  )
}
