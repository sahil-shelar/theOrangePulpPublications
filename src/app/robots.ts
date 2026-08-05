import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theorangepulp.blog'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated surfaces and API routes carry no public content.
        disallow: ['/dashboard/', '/admin', '/api/', '/auth/', '/login', '/reset-password', '/forgot-password'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
