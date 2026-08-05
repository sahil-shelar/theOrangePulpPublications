import { createClient } from '@/lib/supabase/server'
import { Activity, Server, Database, HardDrive, AlertTriangle, Clock } from 'lucide-react'

export const revalidate = 0

export default async function SystemDashboard() {
  const supabase = await createClient()

  const [
    { count: totalArticles },
    { count: totalAuthors },
    { count: activeJobs },
    { count: failedJobs },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('authors').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).in('status', ['pending', 'running']),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
  ])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between border-b-[3px] border-foreground pb-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Admin</p>
          <h1 className="font-heading text-5xl font-black uppercase tracking-tighter text-foreground">System</h1>
        </div>
        <div className="flex items-center gap-2 bg-primary/20 text-foreground px-4 py-2 font-bold uppercase tracking-widest text-xs border-[2px] border-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Online
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="brutal-card bg-background p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Articles</span>
            <Database size={16} className="text-primary" />
          </div>
          <div className="font-heading text-5xl font-black">{totalArticles ?? 0}</div>
        </div>
        <div className="brutal-card bg-background p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Authors</span>
            <Server size={16} className="text-primary" />
          </div>
          <div className="font-heading text-5xl font-black">{totalAuthors ?? 0}</div>
        </div>
        <div className="brutal-card bg-background p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active Jobs</span>
            <Activity size={16} className="text-primary" />
          </div>
          <div className="font-heading text-5xl font-black">{activeJobs ?? 0}</div>
        </div>
        <div className={`brutal-card p-6 ${(failedJobs ?? 0) > 0 ? 'bg-red-50 border-red-400' : 'bg-background'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[9px] font-black uppercase tracking-widest ${(failedJobs ?? 0) > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>Failed Jobs</span>
            <AlertTriangle size={16} className={(failedJobs ?? 0) > 0 ? 'text-red-500' : 'text-muted-foreground'} />
          </div>
          <div className={`font-heading text-5xl font-black ${(failedJobs ?? 0) > 0 ? 'text-red-500' : ''}`}>{failedJobs ?? 0}</div>
        </div>
      </div>

      {/* Info panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="brutal-card bg-secondary p-7">
          <h2 className="font-heading text-xl font-black uppercase mb-5 flex items-center gap-2">
            <HardDrive size={18} /> Storage
          </h2>
          <div className="space-y-3 font-bold uppercase tracking-widest text-sm">
            <div className="flex justify-between border-b-[2px] border-foreground/10 pb-3">
              <span>Media Bucket</span>
              <span className="text-muted-foreground">—</span>
            </div>
            <div className="flex justify-between border-b-[2px] border-foreground/10 pb-3">
              <span>Database</span>
              <span className="text-muted-foreground">—</span>
            </div>
            <div className="flex justify-between pb-3">
              <span>Supabase Plan</span>
              <span className="text-muted-foreground">Free</span>
            </div>
          </div>
        </div>

        <div className="brutal-card bg-background p-7">
          <h2 className="font-heading text-xl font-black uppercase mb-5 flex items-center gap-2">
            <Clock size={18} /> Performance
          </h2>
          <div className="space-y-3 font-bold uppercase tracking-widest text-sm">
            <div className="flex justify-between border-b-[2px] border-foreground/10 pb-3">
              <span>Edge Runtime</span>
              <span className="text-primary">Next.js 15</span>
            </div>
            <div className="flex justify-between border-b-[2px] border-foreground/10 pb-3">
              <span>DB Provider</span>
              <span className="text-primary">Supabase (Postgres)</span>
            </div>
            <div className="flex justify-between pb-3">
              <span>CDN</span>
              <span className="text-primary">Vercel Edge</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
