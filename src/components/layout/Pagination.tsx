import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  basePath: string
  page: number
  totalPages: number
}

/** Builds a compact window of page numbers: 1 … 4 5 6 … 12 */
function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const out: (number | 'gap')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) out.push('gap')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < totalPages - 1) out.push('gap')
  out.push(totalPages)
  return out
}

const href = (basePath: string, p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)

export default function Pagination({ basePath, page, totalPages }: Props) {
  if (totalPages <= 1) return null

  const cell =
    'min-w-[44px] min-h-[44px] flex items-center justify-center border-[3px] border-foreground text-label font-black uppercase tracking-widest transition-colors'

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 mt-14">
      {page > 1 ? (
        <Link href={href(basePath, page - 1)} rel="prev" aria-label="Previous page" className={`${cell} px-4 gap-1 bg-background hover:bg-primary`}>
          <ChevronLeft size={14} strokeWidth={2.5} /> Prev
        </Link>
      ) : (
        <span aria-hidden="true" className={`${cell} px-4 gap-1 bg-muted text-muted-foreground border-foreground/30`}>
          <ChevronLeft size={14} strokeWidth={2.5} /> Prev
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-label font-black text-muted-foreground">
            …
          </span>
        ) : p === page ? (
          <span key={p} aria-current="page" className={`${cell} bg-foreground text-background`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={href(basePath, p)} aria-label={`Page ${p}`} className={`${cell} bg-background hover:bg-primary`}>
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(basePath, page + 1)} rel="next" aria-label="Next page" className={`${cell} px-4 gap-1 bg-background hover:bg-primary`}>
          Next <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${cell} px-4 gap-1 bg-muted text-muted-foreground border-foreground/30`}>
          Next <ChevronRight size={14} strokeWidth={2.5} />
        </span>
      )}
    </nav>
  )
}
