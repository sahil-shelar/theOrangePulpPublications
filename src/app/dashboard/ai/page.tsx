import { createClient } from '@/lib/supabase/server'
import { Sparkles, TrendingUp, AlertTriangle, Check, X, Zap, FileText, Search } from 'lucide-react'

export const revalidate = 0

export default async function AIOperationsCenter() {
  const supabase = await createClient()

  // These tables may not exist yet — fetch gracefully
  const [suggestionsResult, trendsResult, coverageResult, articleCountResult] = await Promise.allSettled([
    supabase.from('ai_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
    supabase.from('trend_opportunities').select('*').eq('status', 'active').order('opportunity_score', { ascending: false }).limit(5),
    supabase.from('movie_coverage_plans').select('*, movies(title)').order('ai_priority_score', { ascending: false }).limit(5),
    supabase.from('articles').select('*', { count: 'exact', head: true }),
  ])

  const suggestions = suggestionsResult.status === 'fulfilled' ? suggestionsResult.value.data : null
  const trends = trendsResult.status === 'fulfilled' ? trendsResult.value.data : null
  const coverage = coverageResult.status === 'fulfilled' ? coverageResult.value.data : null
  const articleCount = articleCountResult.status === 'fulfilled' ? (articleCountResult.value as any).count : 0

  const aiTablesReady = suggestionsResult.status === 'fulfilled' && !suggestionsResult.value.error

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-end justify-between border-b-[3px] border-foreground pb-6">
        <div>
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Intelligence</p>
          <h1 className="font-heading text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            <Sparkles size={36} className="text-primary" />
            AI Center
          </h1>
        </div>
        {aiTablesReady && (
          <div className="flex items-center gap-2 bg-primary/20 text-foreground px-4 py-2 font-bold uppercase tracking-widest text-xs border-[2px] border-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI Online
          </div>
        )}
      </div>

      {/* If AI tables not provisioned yet */}
      {!aiTablesReady && (
        <div className="brutal-card bg-secondary p-8 flex flex-col md:flex-row items-start gap-6">
          <div className="w-12 h-12 shrink-0 border-[3px] border-foreground bg-primary flex items-center justify-center">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-black uppercase text-foreground mb-2">AI Tables Not Yet Provisioned</h2>
            <p className="text-sm font-bold text-foreground/80 mb-4">
              The AI features require additional database tables (<code className="bg-background px-1 border-[1px] border-foreground text-xs">ai_suggestions</code>, <code className="bg-background px-1 border-[1px] border-foreground text-xs">trend_opportunities</code>, <code className="bg-background px-1 border-[1px] border-foreground text-xs">movie_coverage_plans</code>). Run the AI schema migration to enable these features.
            </p>
            <div className="font-mono text-xs bg-background border-[3px] border-foreground p-4 text-foreground/80">
              $ supabase db push --file migrations/ai_tables.sql
            </div>
          </div>
        </div>
      )}

      {/* Stats row — always visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="brutal-card bg-background p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={18} className="text-primary" />
            <span className="text-label font-black uppercase tracking-widest text-muted-foreground">Total Articles</span>
          </div>
          <div className="font-heading text-5xl font-black">{articleCount ?? 0}</div>
        </div>
        <div className="brutal-card bg-primary p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={18} />
            <span className="text-label font-black uppercase tracking-widest">Trend Signals</span>
          </div>
          <div className="font-heading text-5xl font-black">{trends?.length ?? '—'}</div>
        </div>
        <div className="brutal-card bg-secondary p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={18} />
            <span className="text-label font-black uppercase tracking-widest">Coverage Gaps</span>
          </div>
          <div className="font-heading text-5xl font-black">{coverage?.length ?? '—'}</div>
        </div>
      </div>

      {aiTablesReady && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Pending Suggestions */}
          <div className="brutal-card bg-background p-0 overflow-hidden">
            <div className="bg-foreground text-background p-4 flex justify-between items-center">
              <h2 className="font-heading text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Check size={18} /> Pending Approvals
              </h2>
              <span className="bg-primary text-foreground text-label font-black px-2 py-1">{suggestions?.length ?? 0}</span>
            </div>
            <div className="max-h-[440px] overflow-y-auto">
              {suggestions && suggestions.length > 0 ? suggestions.map((s: any) => (
                <div key={s.id} className="p-4 border-b-[2px] border-foreground/10 hover:bg-muted transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-label font-black uppercase tracking-widest bg-secondary px-2 py-1 border-[2px] border-foreground">
                      {s.suggestion_type}
                    </span>
                    <div className="flex gap-1.5">
                      <button className="p-1.5 border-[2px] border-foreground hover:bg-green-500 hover:text-white transition-colors" title="Approve">
                        <Check size={14} />
                      </button>
                      <button className="p-1.5 border-[2px] border-foreground hover:bg-red-500 hover:text-white transition-colors" title="Reject">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs p-3 bg-muted border-[2px] border-foreground/30 text-foreground/80 break-all">
                    {typeof s.content === 'string' ? s.content : JSON.stringify(s.content, null, 2)}
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center font-bold uppercase tracking-widest text-muted-foreground text-xs">
                  No pending suggestions.
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* Trend Opportunities */}
            <div className="brutal-card bg-background p-0 overflow-hidden">
              <div className="bg-foreground text-background p-4">
                <h2 className="font-heading text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={18} /> Trend Detection
                </h2>
              </div>
              {trends && trends.length > 0 ? trends.map((t: any) => (
                <div key={t.id} className="p-4 border-b-[2px] border-foreground/10 flex justify-between items-center hover:bg-muted transition-colors">
                  <div>
                    <div className="font-bold text-sm uppercase tracking-wider">{t.topic}</div>
                    <div className="text-label font-black text-muted-foreground mt-0.5 uppercase tracking-widest">Source: {t.source}</div>
                  </div>
                  <div className="font-heading text-2xl font-black text-primary shrink-0">{t.opportunity_score}</div>
                </div>
              )) : (
                <div className="p-8 text-center font-bold uppercase tracking-widest text-muted-foreground text-xs">
                  No active trends detected.
                </div>
              )}
            </div>

            {/* Coverage Gaps */}
            <div className="brutal-card bg-background p-0 overflow-hidden">
              <div className="bg-foreground text-background p-4">
                <h2 className="font-heading text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={18} /> Coverage Gaps
                </h2>
              </div>
              {coverage && coverage.length > 0 ? coverage.map((c: any) => (
                <div key={c.movie_id} className="p-4 border-b-[2px] border-foreground/10 hover:bg-muted transition-colors">
                  <div className="font-black uppercase tracking-wider text-sm mb-2">{c.movies?.title || 'Unknown Movie'}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {!c.has_review && <span className="text-label font-bold uppercase bg-red-100 text-red-800 px-2 py-1 border border-red-300">No Review</span>}
                    {!c.has_streaming_guide && <span className="text-label font-bold uppercase bg-red-100 text-red-800 px-2 py-1 border border-red-300">No Streaming Guide</span>}
                    {!c.has_ending_explained && <span className="text-label font-bold uppercase bg-red-100 text-red-800 px-2 py-1 border border-red-300">No Ending Explained</span>}
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center font-bold uppercase tracking-widest text-muted-foreground text-xs">
                  No critical coverage gaps.
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
