export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      <div className="border-b-[4px] border-foreground bg-foreground/80">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 flex gap-8 items-end">
          <div className="w-36 h-36 shrink-0 border-[4px] border-background bg-muted" />
          <div className="space-y-4 flex-1">
            <div className="h-3 w-20 bg-background/20 border border-background/10" />
            <div className="h-14 w-64 bg-background/20 border border-background/10" />
            <div className="h-4 w-96 bg-background/20 border border-background/10" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="h-8 w-48 bg-muted border border-foreground/10 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  )
}
