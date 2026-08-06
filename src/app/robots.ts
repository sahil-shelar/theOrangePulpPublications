import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theorangepulp.blog'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated surfaces and API routes carry no public content.
        // /preview renders unpublished drafts behind auth; keep it out of the index
        // so a leaked URL never surfaces in search results.
        disallow: ['/dashboard/', '/admin', '/api/', '/auth/', '/login', '/reset-password', '/forgot-password', '/preview/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
