export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      {/* Cover strip */}
      <div className="w-full h-[50vh] bg-muted border-b-[4px] border-foreground" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Article body */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-4 w-24 bg-muted border border-foreground/10" />
          <div className="h-12 w-full bg-muted border border-foreground/10" />
          <div className="h-12 w-3/4 bg-muted border border-foreground/10" />
          <div className="h-4 w-40 bg-muted border border-foreground/10" />
          <div className="space-y-3 pt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-muted border border-foreground/10" style={{ width: `${85 + (i % 3) * 5}%` }} />
            ))}
          </div>
        </div>
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="h-64 bg-muted border-[3px] border-foreground/10" />
          <div className="h-48 bg-muted border-[3px] border-foreground/10" />
        </div>
      </div>
    </div>
  )
}
