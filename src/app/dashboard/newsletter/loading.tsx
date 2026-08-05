export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-6xl animate-pulse">
      <div className="h-4 w-20 bg-muted border border-foreground/10 mb-2" />
      <div className="h-10 w-40 bg-muted border border-foreground/10 mb-8" />
      <div className="brutal-card p-0 overflow-hidden">
        <div className="h-12 bg-foreground/10" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border-t-[3px] border-foreground/10 p-4 flex items-center gap-4">
            <div className="h-4 w-48 bg-muted border border-foreground/10" />
            <div className="h-4 w-24 bg-muted border border-foreground/10 hidden md:block" />
            <div className="h-4 w-20 bg-muted border border-foreground/10 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
