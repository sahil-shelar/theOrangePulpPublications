import { createClient } from '@/lib/supabase/server'
import { Mail, Users, Send } from 'lucide-react'
import Link from 'next/link'
import { sendCampaign } from '@/lib/actions/newsletter'

export const revalidate = 0

export default async function NewsletterDashboard() {
  const supabase = await createClient()

  const [{ data: campaigns }, { count: subscriberCount }] = await Promise.all([
    supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-[3px] border-foreground pb-6">
        <div>
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Publishing</p>
          <h1 className="font-heading text-5xl font-black uppercase tracking-tighter text-foreground">Newsletter</h1>
        </div>
        <Link href="/dashboard/newsletter/new" className="brutal-button px-5 py-3 flex items-center gap-2 text-xs bg-primary">
          <Mail size={16} /> Create Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="brutal-card bg-background p-6">
          <div className="text-label font-black uppercase tracking-widest text-muted-foreground mb-2">Subscribers</div>
          <div className="font-heading text-5xl font-black">{(subscriberCount ?? 0).toLocaleString()}</div>
        </div>
        <div className="brutal-card bg-secondary p-6">
          <div className="text-label font-black uppercase tracking-widest text-muted-foreground mb-2">Avg Open Rate</div>
          <div className="font-heading text-5xl font-black">—</div>
        </div>
        <div className="brutal-card bg-background p-6">
          <div className="text-label font-black uppercase tracking-widest text-muted-foreground mb-2">Avg Click Rate</div>
          <div className="font-heading text-5xl font-black">—</div>
        </div>
        <div className="brutal-card bg-primary p-6">
          <div className="text-label font-black uppercase tracking-widest mb-2">Campaigns</div>
          <div className="font-heading text-5xl font-black">{campaigns?.length ?? 0}</div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="brutal-card bg-background p-0 overflow-hidden">
        <div className="bg-foreground text-background p-4">
          <h2 className="font-heading text-lg font-black uppercase tracking-widest">Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-[3px] border-foreground text-label font-black uppercase tracking-widest text-muted-foreground bg-muted">
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Opens</th>
                <th className="p-3.5">Clicks</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {campaigns && campaigns.length > 0 ? campaigns.map((campaign: any) => (
                <tr key={campaign.id} className="border-t-[3px] border-foreground hover:bg-muted transition-colors">
                  <td className="p-3.5 font-bold text-sm">{campaign.subject}</td>
                  <td className="p-3.5">
                    <span className={`text-label font-black uppercase tracking-widest px-2 py-1 border-[2px] border-foreground ${campaign.status === 'sent' ? 'bg-primary' : 'bg-secondary'}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs font-bold text-muted-foreground">
                    {campaign.sent_at || campaign.scheduled_at
                      ? new Date(campaign.sent_at || campaign.scheduled_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="p-3.5 font-bold text-sm">{campaign.open_rate != null ? `${campaign.open_rate}%` : '—'}</td>
                  <td className="p-3.5 font-bold text-sm">{campaign.click_rate != null ? `${campaign.click_rate}%` : '—'}</td>
                  <td className="p-3.5">
                    {campaign.status !== 'sent' && (
                      <form action={sendCampaign}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <button type="submit" className="text-label font-black uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors">
                          <Send size={13} /> Send
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">
                    No campaigns yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
