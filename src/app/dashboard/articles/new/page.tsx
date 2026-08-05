import Link from 'next/link'
import { ArrowLeft, Newspaper, Star, ListOrdered, Sparkles } from 'lucide-react'

const TYPES = [
  { type: 'news', label: 'News', desc: 'Headline, source, lead paragraph, body.', icon: Newspaper },
  { type: 'review', label: 'Review', desc: 'Movie selector, OP/IMDb/RT scores, verdict, review body.', icon: Star },
  { type: 'list', label: 'Rankings / List', desc: 'Ranked movie cards — search & add items, blurb, rating each.', icon: ListOrdered },
  { type: 'spotlight', label: 'Spotlight', desc: 'Subject bio, pull quote, notable works.', icon: Sparkles },
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
        <p className="text-sm font-medium text-muted-foreground mb-8">Pick a type — each has its own fields and page layout. This can't be changed after creation.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TYPES.map(({ type, label, desc, icon: Icon }) => (
            <Link
              key={type}
              href={`/dashboard/articles/new/${type}`}
              className="group brutal-card bg-background p-6 flex flex-col gap-3 hover:-translate-y-1 hover:bg-primary transition-all"
            >
              <Icon size={28} strokeWidth={2} />
              <h2 className="font-heading text-xl font-black uppercase tracking-tight">{label}</h2>
              <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground/80">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
