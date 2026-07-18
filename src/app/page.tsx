import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full">
      {/* Featured / Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-end">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-6 w-full pb-20">
          <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">
            Featured Spotlight
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.1] max-w-4xl text-foreground mb-6">
            The Golden Era of Indie Cinema Returns
          </h1>
          <p className="text-foreground/80 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed font-light">
            How a new wave of visionary directors is redefining the theatrical experience, blending high-art sensibilities with accessible storytelling.
          </p>
          <Link href="/posts/indie-cinema-returns" className="inline-flex items-center gap-2 border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-3 rounded-full transition-all text-sm font-bold uppercase tracking-widest">
            Read the Feature <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Column - Latest Articles */}
        <div className="lg:col-span-8">
          <div className="flex items-baseline justify-between mb-10 border-b border-border pb-4">
            <h2 className="font-serif text-3xl font-bold text-foreground">Latest Reviews</h2>
            <Link href="/reviews" className="text-sm font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <article key={i} className="group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden rounded-lg mb-6 bg-muted relative">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                       style={{ backgroundImage: `url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop&sig=${i}')` }} />
                </div>
                <span className="text-primary font-bold text-xs uppercase tracking-widest mb-3 block">Movie Review</span>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
                  Dune: Part Two - A Cinematic Triumph
                </h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                  Denis Villeneuve masterfully scales the unscalable, delivering a sci-fi epic that redefines modern blockbuster filmmaking.
                </p>
                <div className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                  By Editorial Team &nbsp;&middot;&nbsp; 5 min read
                </div>
              </article>
            ))}
          </div>

          {/* Inline Ad Placeholder */}
          <div className="my-16 w-full py-12 bg-muted border border-border flex flex-col items-center justify-center rounded-lg text-foreground/40 font-mono text-sm">
            <span>[ Advertisement Space ]</span>
            <span className="text-xs mt-2">728 x 90 Leaderboard</span>
          </div>

          <div className="flex items-baseline justify-between mb-10 border-b border-border pb-4 mt-8">
            <h2 className="font-serif text-3xl font-bold text-foreground">Industry News</h2>
            <Link href="/news" className="text-sm font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors">
              View All
            </Link>
          </div>

          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <article key={i} className="flex gap-6 group cursor-pointer">
                <div className="w-1/3 aspect-video rounded-lg overflow-hidden bg-muted relative shrink-0">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                       style={{ backgroundImage: `url('https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=600&auto=format&fit=crop&sig=${i}')` }} />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">Breaking</span>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
                    Nolan Announces Next Secret Project for 2027
                  </h3>
                  <p className="text-foreground/70 text-sm leading-relaxed mb-3 line-clamp-2">
                    Universal sets a prime summer release date as the acclaimed director teams up with frequent collaborators.
                  </p>
                  <div className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                    2 hours ago
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-12">
          
          {/* Sidebar Ad */}
          <div className="w-full aspect-square bg-muted border border-border flex flex-col items-center justify-center rounded-lg text-foreground/40 font-mono text-sm">
            <span>[ Advertisement ]</span>
            <span className="text-xs mt-2">300 x 250</span>
          </div>

          <div>
            <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-foreground mb-6 border-b border-border pb-4">
              Trending Now
            </h3>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="text-3xl font-serif font-bold text-border group-hover:text-primary transition-colors">
                    0{i}
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      Top 10 Essential A24 Films Ranked
                    </h4>
                    <div className="text-xs font-bold uppercase tracking-widest text-foreground/50 mt-2">
                      Lists
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted p-8 rounded-lg border border-border">
            <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
              The OrangePulp Letter
            </h3>
            <p className="text-foreground/70 text-sm leading-relaxed mb-6">
              Exclusive editorial pieces, early reviews, and industry insights delivered straight to your inbox.
            </p>
            <form className="space-y-4">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-foreground text-background font-bold uppercase tracking-widest text-xs py-3 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>

        </aside>

      </div>
    </div>
  );
}
