export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      <div className="border-b-[4px] border-foreground bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 border-b-[4px] border-foreground space-y-4">
          <div className="h-3 w-20 bg-muted border border-foreground/10" />
          <div className="h-16 w-72 bg-muted border border-foreground/10" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="lg:col-span-4">
          <div className="h-48 bg-muted border-[3px] border-foreground/10" />
        </div>
      </div>
    </div>
  )
}
