export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-background flex flex-col">

      {/* Hero skeleton */}
      <div className="w-full h-[60vh] bg-muted border-b-[3px] border-foreground animate-pulse" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 w-full py-14">

        {/* Section header skeleton */}
        <div className="h-8 w-40 bg-muted border-[2px] border-foreground/20 mb-7 animate-pulse" />

        {/* Article card grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="brutal-card p-0 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-16 bg-muted border border-foreground/10" />
                <div className="h-5 w-full bg-muted border border-foreground/10" />
                <div className="h-5 w-3/4 bg-muted border border-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
