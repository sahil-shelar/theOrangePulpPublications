import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { createCampaign } from '@/lib/actions/newsletter'


export default function NewCampaignPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/dashboard/newsletter" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Newsletter
        </Link>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">New Campaign</h1>
      </div>

      <form action={createCampaign} className="space-y-6 brutal-card bg-background p-8">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Subject Line *</label>
          <input
            type="text"
            name="subject"
            required
            placeholder="e.g. This Week at The Orange Pulp"
            className="w-full bg-background border-[3px] border-foreground p-3 font-bold focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Body *</label>
          <textarea
            name="content"
            rows={12}
            required
            placeholder="Write your newsletter content here…"
            className="w-full bg-background border-[3px] border-foreground p-3 font-bold focus:outline-none resize-y font-mono text-sm"
          />
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">Saved as draft. Use the Send button in the campaign list to send.</p>
        </div>

        <div className="pt-4 border-t-[3px] border-foreground">
          <button type="submit" className="brutal-button py-4 px-8 w-full flex items-center justify-center gap-2">
            <Send size={16} /> Save Draft
          </button>
        </div>
      </form>
    </div>
  )
}
