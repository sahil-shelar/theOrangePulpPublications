import { getCachedPublicArticleBySlug, getPublishedSlugs } from "@/lib/api/articles"
import { notFound } from "next/navigation"
import ArticleDetailView from "@/components/article/ArticleDetailView"

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('review')
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getCachedPublicArticleBySlug(slug)
  if (!article || article.status !== 'published') return {}
  const title = article.seo_title || article.title
  const description = article.seo_description || article.excerpt || ''
  const image = article.og_image_url || article.cover_image_url || ''
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.published_at || article.created_at,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getCachedPublicArticleBySlug(slug)

  if (!article || article.status !== 'published' || article.type !== 'review') {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theorangepulp.blog'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: article.title,
    description: article.excerpt || '',
    datePublished: article.published_at || article.created_at,
    author: { '@type': 'Person', name: (article as any).authors?.name || 'The Orange Pulp' },
    publisher: { '@type': 'Organization', name: 'The Orange Pulp', url: siteUrl },
    url: `${siteUrl}/reviews/${slug}`,
    ...(article.cover_image_url && { image: article.cover_image_url }),
    ...((article as any).movies && {
      itemReviewed: {
        '@type': 'Movie',
        name: (article as any).movies.title,
        image: (article as any).movies.poster_url || (article as any).movies.backdrop_url,
      },
    }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleDetailView article={article} />
    </>
  )
}
