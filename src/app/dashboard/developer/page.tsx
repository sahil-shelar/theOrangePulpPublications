'use client'

import { useState } from 'react'

export default function DeveloperDashboard() {
  const [loading, setLoading] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const runSeeder = async (command: string) => {
    setLoading(command)
    setLogs(prev => [...prev, `Starting: npm run seed -- ${command}...`])
    
    try {
      const res = await fetch(`/api/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      })
      const data = await res.json()
      
      setLogs(prev => [...prev, `Completed: ${command}`, data.message || 'Success'])
    } catch (e: any) {
      setLogs(prev => [...prev, `Error: ${e.message}`])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-8 border-b-4 border-foreground pb-2">Developer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold uppercase mb-4">Seeding Operations</h2>
          
          <button 
            onClick={() => runSeeder('--all')}
            disabled={loading !== null}
            className="w-full text-left p-4 bg-primary font-black uppercase hover:bg-primary/80 disabled:opacity-50 brutal-card"
          >
            Generate Full Demo Data
            <span className="block text-xs font-normal normal-case mt-1">Runs all seeders (idempotent)</span>
          </button>

          <button 
            onClick={() => runSeeder('--movies')}
            disabled={loading !== null}
            className="w-full text-left p-4 bg-secondary font-black uppercase hover:bg-secondary/80 disabled:opacity-50 brutal-card"
          >
            Import Latest TMDb
            <span className="block text-xs font-normal normal-case mt-1">Fetches popular and trending movies & TV</span>
          </button>

          <button 
            onClick={() => runSeeder('--articles')}
            disabled={loading !== null}
            className="w-full text-left p-4 bg-foreground text-background font-black uppercase hover:opacity-90 disabled:opacity-50 brutal-card"
          >
            Generate AI Articles
            <span className="block text-xs font-normal normal-case mt-1">Generates reviews, news, spotlights</span>
          </button>

          <button 
            onClick={() => runSeeder('--comments')}
            disabled={loading !== null}
            className="w-full text-left p-4 border-4 border-foreground font-black uppercase hover:bg-muted disabled:opacity-50 brutal-card"
          >
            Generate Community Activity
            <span className="block text-xs font-normal normal-case mt-1">Generates comments, reactions, bookmarks</span>
          </button>

          <button
            onClick={() => runSeeder('--analytics')}
            disabled={loading !== null}
            className="w-full text-left p-4 border-4 border-foreground font-black uppercase hover:bg-muted disabled:opacity-50 brutal-card"
          >
            Generate Analytics
            <span className="block text-xs font-normal normal-case mt-1">Generates 365 days of page views</span>
          </button>

          <button
            onClick={() => runSeeder('--newsletter')}
            disabled={loading !== null}
            className="w-full text-left p-4 border-4 border-foreground font-black uppercase hover:bg-muted disabled:opacity-50 brutal-card"
          >
            Seed Newsletter Subscribers
            <span className="block text-xs font-normal normal-case mt-1">Seeds 300 newsletter_subscribers rows</span>
          </button>

          <button
            onClick={() => runSeeder('--media')}
            disabled={loading !== null}
            className="w-full text-left p-4 border-4 border-foreground font-black uppercase hover:bg-muted disabled:opacity-50 brutal-card"
          >
            Seed Media Library
            <span className="block text-xs font-normal normal-case mt-1">Registers movie poster/backdrop URLs in media table</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold uppercase">Execution Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs font-bold uppercase border-2 border-foreground px-3 py-1 hover:bg-muted"
            >
              Clear
            </button>
          </div>
          <div className="bg-foreground text-green-400 font-mono text-sm p-4 h-[500px] overflow-y-auto brutal-card">
            {logs.length === 0 ? (
              <span className="text-gray-500">No logs yet...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-2">{`> ${log}`}</div>
              ))
            )}
            {loading && <div className="animate-pulse mt-2">Processing {loading}...</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
