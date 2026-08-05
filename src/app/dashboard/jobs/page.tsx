// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { Activity, CheckCircle, XCircle, Clock, Ban } from 'lucide-react'
import JobActions from '@/components/dashboard/JobActions'
import TriggerRunnerButton from '@/components/dashboard/TriggerRunnerButton'

export const revalidate = 0

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    running:   { icon: <Activity size={14} className="animate-pulse" />, cls: 'text-blue-600 bg-blue-50' },
    pending:   { icon: <Clock size={14} />,                              cls: 'text-yellow-600 bg-yellow-50' },
    completed: { icon: <CheckCircle size={14} />,                        cls: 'text-green-600 bg-green-50' },
    failed:    { icon: <XCircle size={14} />,                            cls: 'text-red-600 bg-red-50' },
    cancelled: { icon: <Ban size={14} />,                                cls: 'text-muted-foreground bg-muted' },
  }
  const s = map[status] ?? { icon: null, cls: 'bg-muted' }
  return (
    <span className={`flex items-center gap-1.5 text-label font-black uppercase tracking-widest px-2 py-1 border-[2px] border-foreground w-max ${s.cls}`}>
      {s.icon} {status}
    </span>
  )
}

export default async function JobsDashboardPage() {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Admin</p>
          <h1 className="font-heading text-4xl font-black uppercase text-foreground">Background Jobs</h1>
        </div>
        <TriggerRunnerButton />
      </div>

      <div className="brutal-card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-foreground text-background text-label font-black uppercase tracking-widest">
              <th className="p-3.5">Job Type</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 hidden md:table-cell">Attempts</th>
              <th className="p-3.5 hidden md:table-cell">Scheduled</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!jobs || jobs.length === 0) ? (
              <tr>
                <td colSpan={5} className="p-10 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">
                  No jobs found
                </td>
              </tr>
            ) : jobs.map((job) => (
              <tr key={job.id} className="border-t-[3px] border-foreground hover:bg-muted transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-sm">{job.job_type}</div>
                  {job.status === 'failed' && (
                    <div className="text-label text-red-500 mt-1 font-mono">{job.failed_reason}</div>
                  )}
                </td>
                <td className="p-3.5"><StatusBadge status={job.status} /></td>
                <td className="p-3.5 hidden md:table-cell text-xs font-bold text-muted-foreground">{job.attempts ?? 0}</td>
                <td className="p-3.5 hidden md:table-cell text-xs font-bold text-muted-foreground">
                  {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : '—'}
                </td>
                <td className="p-3.5 text-right">
                  <JobActions id={job.id} status={job.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
