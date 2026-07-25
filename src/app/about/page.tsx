import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | The Orange Pulp",
  description: "The Orange Pulp is a premium film publication covering reviews, news, and cinema culture.",
};

export default function AboutPage() {
  return (
    <div className="w-full bg-background min-h-screen">

      {/* Header */}
      <div className="border-b-[4px] border-foreground bg-primary">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-3">Who We Are</p>
          <h1 className="font-heading text-6xl md:text-8xl font-black uppercase text-foreground leading-none">
            About
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12">

        {/* Main copy */}
        <div className="md:col-span-7 space-y-8">
          <div className="border-l-[4px] border-foreground pl-6">
            <p className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
              The Orange Pulp is a film publication built for people who take cinema seriously — without taking themselves too seriously.
            </p>
          </div>

          <p className="text-base text-foreground/75 leading-loose">
            We cover movies the way they deserve: honest reviews, sharp criticism, deep dives into directors and genres, and coverage of the moments that make film culture worth following. No studio press releases, no clickbait rankings. Just considered takes from writers who watch obsessively.
          </p>

          <p className="text-base text-foreground/75 leading-loose">
            From arthouse to blockbuster, from Cannes buzz to your local multiplex — if it's worth talking about, we'll talk about it. Our Spotlight series digs into careers and craft. Our Rankings are built on data and argument, not vibes.
          </p>

          <p className="text-base text-foreground/75 leading-loose">
            The Orange Pulp launched as an independent project by a small team of film-obsessed writers and developers. We're not backed by a media conglomerate. We answer to our readers.
          </p>
        </div>

        {/* Sidebar stats */}
        <div className="md:col-span-5 space-y-0">
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-foreground/50 mb-6">By The Numbers</h2>
          {[
            ["500+", "Reviews Published"],
            ["50+", "Writers & Contributors"],
            ["12", "Genres Covered"],
            ["Weekly", "Newsletter Cadence"],
          ].map(([stat, label]) => (
            <div key={label} className="border-[3px] border-foreground border-b-0 last:border-b-[3px] px-6 py-5 flex items-center justify-between">
              <span className="font-heading text-3xl font-black uppercase text-foreground">{stat}</span>
              <span className="text-xs font-black uppercase tracking-widest text-foreground/50">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="border-t-[4px] border-foreground bg-muted">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
          <h2 className="font-heading text-3xl font-black uppercase text-foreground mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { title: "Independence", body: "No parent company, no ad deals that compromise coverage. Our reviews are ours." },
              { title: "Criticism", body: "We believe film criticism is an art form. We publish opinions, not summaries." },
              { title: "Depth", body: "We'll always go deeper than the surface. Context, craft, and history matter." },
            ].map(({ title, body }) => (
              <div key={title} className="border-[3px] border-foreground border-r-0 last:border-r-[3px] p-8">
                <h3 className="font-heading text-lg font-black uppercase text-foreground mb-3">{title}</h3>
                <p className="text-sm text-foreground/65 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
