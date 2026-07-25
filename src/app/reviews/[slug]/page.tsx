import { getCachedArticleBySlug, getPublishedSlugs } from "@/lib/api/articles"
import { notFound } from "next/navigation"
import ArticleDetailView from "@/components/article/ArticleDetailView"

export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('review')
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getCachedArticleBySlug(slug)
  if (!article || article.status !== 'published') return {}
  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    openGraph: {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      images: article.og_image_url || article.cover_image_url ? [{ url: article.og_image_url || article.cover_image_url }] : [],
    }
  }
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getCachedArticleBySlug(slug) // same cache hit as generateMetadata

  if (!article || article.status !== 'published' || article.type !== 'review') {
    notFound()
  }

  return <ArticleDetailView article={article} />
}
