import Link from 'next/link'
import { ArrowLeft, Newspaper, Star, ListOrdered, Sparkles, Wand2 } from 'lucide-react'

// `generate` names where the AI route for this type lives, when there is one.
// News and reviews have none: both depend on facts TMDB does not record — what
// happened this week, and what a viewer made of a film — so there is nothing to
// generate from. Rankings and spotlights are built entirely from structured
// TMDB data, which is what makes them safe to draft.
const TYPES = [
  { type: 'news', label: 'News', desc: 'Headline, source, lead paragraph, body.', icon: Newspaper, generate: null },
  { type: 'review', label: 'Review', desc: 'Movie selector, OP/IMDb/RT scores, verdict, review body.', icon: Star, generate: null },
  {
    type: 'list',
    label: 'Rankings / List',
    desc: 'Ranked movie cards — search & add items, blurb, rating each.',
    icon: ListOrdered,
    generate: { href: '/dashboard/ai#gen-ranking', label: 'Generate from a topic' },
  },
  {
    type: 'spotlight',
    label: 'Spotlight',
    desc: 'Subject bio, pull quote, notable works.',
    icon: Sparkles,
    generate: { href: '/dashboard/ai#gen-spotlight', label: 'Generate from a new release' },
  },
] as const

export default function NewArticleTypePickerPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-5xl mx-auto mb-10">
        <Link href="/dashboard/articles" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background border-[3px] border-transparent hover:border-foreground px-4 py-2 transition-all">
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </div>

      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">New Article</h1>
        <p className="text-sm font-medium text-muted-foreground mb-8">Pick a type — each has its own fields and page layout. This can&apos;t be changed after creation.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TYPES.map(({ type, label, desc, icon: Icon, generate }) => (
            // The card is no longer a single <Link>: a nested anchor inside an
            // anchor is invalid and does not receive clicks, so the wrapper is a
            // div and the "write manually" link fills it instead.
            <div key={type} className="brutal-card p-6 flex flex-col gap-3">
              <Icon size={24} strokeWidth={2.5} />
              <h2 className="font-heading text-xl font-black uppercase tracking-tight">{label}</h2>
              <p className="text-xs font-bold text-muted-foreground">{desc}</p>

              <div className="mt-auto pt-3 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/articles/new/${type}`}
                  className="inline-flex items-center gap-1.5 border-[2px] border-foreground bg-background px-3 py-2 text-label font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Write it
                </Link>

                {generate && (
                  <Link
                    href={generate.href}
                    className="inline-flex items-center gap-1.5 border-[2px] border-foreground bg-secondary text-primary-foreground px-3 py-2 text-label font-black uppercase tracking-widest hover:bg-primary transition-colors"
                  >
                    <Wand2 size={13} strokeWidth={2.5} /> {generate.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-meta font-medium text-muted-foreground mt-8 max-w-2xl">
          Generated pieces are always saved as drafts and never published for you. TMDB data is
          user-contributed and the model has been observed adding detail that was never supplied,
          so a person reads every draft before it goes out.
        </p>
      </div>
    </div>
  )
}
