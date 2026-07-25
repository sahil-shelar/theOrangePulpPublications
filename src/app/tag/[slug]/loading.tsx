export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      <div className="border-b-[4px] border-foreground bg-secondary/60">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 space-y-3">
          <div className="h-3 w-12 bg-muted border border-foreground/10" />
          <div className="h-16 w-56 bg-muted border border-foreground/10" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="brutal-card p-0 overflow-hidden">
            <div className="aspect-[4/3] bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-16 bg-muted border border-foreground/10" />
              <div className="h-5 w-full bg-muted border border-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
