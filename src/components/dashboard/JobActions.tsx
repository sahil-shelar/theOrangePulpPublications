'use client'

import { useState } from 'react'
import { RotateCcw, Ban, Server } from 'lucide-react'
import { retryJob, cancelJob } from '@/lib/actions/jobs'

export default function JobActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleRetry = async () => {
    setLoading('retry')
    try { await retryJob(id) } finally { setLoading(null) }
  }

  const handleCancel = async () => {
    setLoading('cancel')
    try { await cancelJob(id) } finally { setLoading(null) }
  }

  return (
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
      <button className="p-2 bg-background border-[3px] border-foreground hover:-translate-y-1 transition-transform" title="Logs">
        <Server size={14} />
      </button>
    </div>
  )
}
