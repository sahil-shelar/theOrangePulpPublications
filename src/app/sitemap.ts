// @ts-nocheck
import { MetadataRoute } from 'next'
import { getLatestArticles } from '@/lib/api/articles'
import { getCategories, getAuthors, getTags } from '@/lib/api/taxonomy'
import { typeToRoute } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theorangepulp.com'
  
  const articles = await getLatestArticles(100)
  const categories = await getCategories()
  const authors = await getAuthors()
  const tags = await getTags()

  const articleUrls = articles.map(a => ({
    url: `${baseUrl}/${typeToRoute(a.type)}/${a.slug}`,
    lastModified: new Date(a.updated_at || a.published_at || a.created_at)
  }))
  
  const categoryUrls = categories.map(c => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(c.updated_at || c.created_at)
  }))

  const authorUrls = authors.map(a => ({
    url: `${baseUrl}/author/${a.slug}`,
    lastModified: new Date(a.updated_at || a.created_at)
  }))

  const tagUrls = tags.map(t => ({
    url: `${baseUrl}/tag/${t.slug}`,
    lastModified: new Date(t.created_at)
  }))
  
  return [
    { url: baseUrl, lastModified: new Date() },
    ...articleUrls,
    ...categoryUrls,
    ...authorUrls,
    ...tagUrls
  ]
}
