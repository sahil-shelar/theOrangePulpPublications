// Preview an article exactly as it will publish, before publishing it.
//
// Lives outside /dashboard deliberately: under the dashboard layout the sidebar
// would change the available width, so the preview would not match the real page.
// Here it inherits the same root layout (header, footer, theme) the live article
// gets, and the only difference from production is the banner and the suppressed
// view counter.
//
// Auth: /preview is gated in middleware alongside /dashboard, and re-checked here
// so the page cannot render unpublished content if that ever changes.

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { getCurrentUser } from '@/lib/api/auth'
import { getArticleByIdForPreview } from '@/lib/api/articles'
import { PreviewProvider } from '@/components/article/PreviewMode'
import ArticleDetailView from '@/components/article/ArticleDetailView'
import ReviewDetailView from '@/components/article/ReviewDetailView'
import SpotlightDetailView from '@/components/article/SpotlightDetailView'
import ListDetailView from '@/components/article/ListDetailView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Preview', robots: { index: false, follow: false } }

// Pastel fills carry a FIXED dark foreground in both themes. Using text-foreground
// here put cream text on the yellow draft badge in dark mode, which was unreadable.
const STATUS_TONE: Record<string, string> = {
  draft: 'bg-secondary text-primary-foreground',
  published: 'bg-primary text-primary-foreground',
  archived: 'bg-muted text-foreground',
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user) redirect(`/login?redirect=/preview/${id}`)

  const article = await getArticleByIdForPreview(id)
  if (!article) notFound()

  const type = (article as any).type as string
  const status = (article as any).status as string

  const View =
    type === 'review' ? ReviewDetailView
      : type === 'spotlight' ? SpotlightDetailView
      : type === 'list' ? ListDetailView
      : ArticleDetailView

  return (
    <PreviewProvider>
      {/* Unmissable, and sticky so it stays true even in a screenshot of the
          middle of the page — a preview must never be mistaken for the live site. */}
      <div className="sticky top-0 z-50 border-b-[3px] border-foreground bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-2 text-label font-black uppercase tracking-widest">
            <Eye size={14} strokeWidth={2.5} aria-hidden /> Preview — not live
          </span>

          <span className={`text-label font-black uppercase tracking-widest px-2 py-0.5 border-[2px] border-background ${STATUS_TONE[status] ?? ''}`}>
            {status}
          </span>

          <span className="text-label font-bold uppercase tracking-widest opacity-70">{type}</span>

          <Link
            href={`/dashboard/articles/${id}/edit`}
            className="ml-auto inline-flex items-center gap-1.5 border-[2px] border-background px-3 py-1 text-label font-black uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
          >
            <Pencil size={12} strokeWidth={2.5} aria-hidden /> Edit
          </Link>
        </div>
      </div>

      {/* @ts-expect-error — the four detail views are async server components with
          identical `{ article }` props; the union of their prop types confuses TS. */}
      <View article={article} />
    </PreviewProvider>
  )
}
