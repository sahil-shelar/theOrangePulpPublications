'use client'

import { useState } from 'react'
import { RotateCcw, Ban, Server, X } from 'lucide-react'
import { retryJob, cancelJob, getJobLogs, type JobLogRow } from '@/lib/actions/jobs'

// Level tones use the brand pastels, which are light in BOTH themes — so the
// text on them is pinned to primary-foreground rather than a flipping token.
const LEVEL_TONE: Record<JobLogRow['level'], string> = {
  info: 'bg-accent text-primary-foreground',
  warning: 'bg-secondary text-primary-foreground',
  error: 'bg-destructive text-destructive-foreground',
}

export default function JobActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  // Logs are fetched on demand rather than joined into the jobs query: the table
  // shows 100 jobs and almost none of them are ever expanded.
  const [logs, setLogs] = useState<JobLogRow[] | null>(null)
  const [logError, setLogError] = useState<string | null>(null)

  const handleRetry = async () => {
    setLoading('retry')
    try { await retryJob(id) } finally { setLoading(null) }
  }

  const handleCancel = async () => {
    setLoading('cancel')
    try { await cancelJob(id) } finally { setLoading(null) }
  }

  const handleLogs = async () => {
    if (logs) { setLogs(null); setLogError(null); return }
    setLoading('logs')
    setLogError(null)
    try {
      const { logs: rows, error } = await getJobLogs(id)
      // An empty result is a real answer — a job can genuinely have no logs — so
      // it must not read the same as a failed fetch.
      if (error) setLogError(error)
      setLogs(rows)
    } catch (err) {
      setLogError(err instanceof Error ? err.message : String(err))
      setLogs([])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center justify-end gap-2">
        {status === 'failed' && (
          <button
            onClick={handleRetry}
            disabled={loading === 'retry'}
            className="p-2 bg-background border-[3px] border-foreground hover:-translate-y-1 transition-transform disabled:opacity-50"
            title="Retry"
          >
            <RotateCcw size={14} className={loading === 'retry' ? 'animate-spin' : ''} />
          </button>
        )}
        {(status === 'pending' || status === 'retrying') && (
          <button
            onClick={handleCancel}
            disabled={loading === 'cancel'}
            className="p-2 bg-red-500 text-white border-[3px] border-foreground hover:-translate-y-1 transition-transform disabled:opacity-50"
            title="Cancel"
          >
            <Ban size={14} />
          </button>
        )}
        <button
          onClick={handleLogs}
          disabled={loading === 'logs'}
          aria-expanded={logs !== null}
          className={`p-2 border-[3px] border-foreground hover:-translate-y-1 transition-transform disabled:opacity-50 ${
            logs !== null ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
          title={logs !== null ? 'Hide logs' : 'Show logs'}
        >
          {logs !== null ? <X size={14} /> : <Server size={14} className={loading === 'logs' ? 'animate-pulse' : ''} />}
        </button>
      </div>

      {logs !== null && (
        <div className="w-full max-w-2xl border-[3px] border-foreground bg-muted p-3 text-left">
          {logError && (
            <p className="text-label font-black uppercase tracking-widest text-destructive mb-2">{logError}</p>
          )}

          {logs.length === 0 && !logError ? (
            <p className="text-label font-bold uppercase tracking-widest text-muted-foreground">
              No log entries for this job.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {logs.map(log => (
                <li key={log.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-label font-black uppercase tracking-widest px-2 py-0.5 border-[2px] border-foreground ${LEVEL_TONE[log.level]}`}>
                      {log.level}
                    </span>
                    <span className="text-label font-bold uppercase tracking-widest text-muted-foreground tabular-nums">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  {/* break-words, not truncate: a failure reason is the entire
                      value of this panel and a TMDB or Gemini error is long. */}
                  <p className="text-xs font-medium text-foreground break-words whitespace-pre-wrap">{log.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
