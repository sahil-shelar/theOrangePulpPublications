import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import GenerateRankingForm from '@/components/dashboard/GenerateRankingForm'

export const metadata = { title: 'Generate Ranking' }

export default function GenerateRankingPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/articles"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background border-[3px] border-transparent hover:border-foreground px-4 py-2 transition-all mb-6"
        >
          <ArrowLeft size={16} /> Articles
        </Link>

        <div className="border-b-[3px] border-foreground pb-6 mb-8">
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">
            Rankings
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            <Sparkles size={24} className="text-primary" />
            Generate
          </h1>
        </div>

        {/* Kept as a working URL rather than redirected — it may be bookmarked.
            The discoverable home for generation is the AI Center, which carries
            this form plus the spotlight generator. */}
        <p className="text-meta font-medium text-muted-foreground mb-6">
          Also available in the{' '}
          <Link href="/dashboard/ai" className="font-black underline decoration-primary decoration-2 underline-offset-2 hover:decoration-foreground">
            AI Center
          </Link>
          , alongside spotlight generation.
        </p>

        <GenerateRankingForm />
      </div>
    </div>
  )
}
