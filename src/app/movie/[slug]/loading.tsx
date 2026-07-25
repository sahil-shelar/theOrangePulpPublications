export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      {/* Backdrop hero */}
      <div className="relative w-full h-[60vh] bg-foreground/80 border-b-[6px] border-foreground flex items-end">
        <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto w-full flex gap-8 items-end">
          <div className="w-32 md:w-48 aspect-[2/3] bg-muted border-[4px] border-background shrink-0" />
          <div className="flex-1 pb-4 space-y-4">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-background/20" />
              <div className="h-5 w-16 bg-background/20" />
            </div>
            <div className="h-14 w-80 bg-background/20" />
            <div className="h-4 w-48 bg-background/20" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-32 bg-muted border border-foreground/10" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-muted border border-foreground/10" style={{ width: `${80 + (i % 3) * 7}%` }} />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-40 bg-muted border-[3px] border-foreground/10" />
          <div className="h-32 bg-muted border-[3px] border-foreground/10" />
        </div>
      </div>
    </div>
  )
}
