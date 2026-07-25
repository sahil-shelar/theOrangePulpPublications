export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl animate-pulse">
      <div className="h-4 w-24 bg-muted border border-foreground/10 mb-2" />
      <div className="h-10 w-48 bg-muted border border-foreground/10 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="brutal-card p-5 space-y-3">
            <div className="h-3 w-16 bg-muted border border-foreground/10" />
            <div className="h-8 w-12 bg-muted border border-foreground/10" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="brutal-card p-0 overflow-hidden">
          <div className="h-10 bg-foreground/10" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-t-[2px] border-foreground/10 p-4 flex gap-4">
              <div className="h-4 w-32 bg-muted border border-foreground/10" />
              <div className="h-4 w-16 bg-muted border border-foreground/10 ml-auto" />
            </div>
          ))}
        </div>
        <div className="brutal-card p-5 space-y-4">
          <div className="h-6 w-32 bg-muted border border-foreground/10" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-muted border border-foreground/10" />
          ))}
        </div>
      </div>
    </div>
  )
}
