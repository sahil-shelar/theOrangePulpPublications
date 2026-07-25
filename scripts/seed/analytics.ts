import { supabase } from './config'
import { getRandomInt, getRandomDate, getRandomElement } from './helpers'

export async function generateHistoricalAnalytics(articleId: string, slug: string, type: string, daysBack = 365) {
  const pageViews = []
  const now = new Date()
  
  // Total views for this article
  let totalViews = 0

  for (let i = 0; i < daysBack; i += 7) { 
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const baseTraffic = Math.max(0, 50 - Math.floor(i / 10)) 
    const views = getRandomInt(10, 50) + baseTraffic
    
    totalViews += views

    // Generate individual page views for the most recent week to not blow up DB
    if (i < 30) {
      for(let j=0; j<10; j++) {
        pageViews.push({
          article_id: articleId,
          path: `/${type}s/${slug}`,
          visitor_id: `visitor_${getRandomInt(1000, 9999)}`,
          referrer: getRandomElement(['google.com', 'twitter.com', 'direct', 'facebook.com']),
          duration_seconds: getRandomInt(10, 300),
          created_at: new Date(date.getTime() + getRandomInt(0, 86400000)).toISOString()
        })
      }
    }
  }

  if (pageViews.length > 0) {
    await supabase.from('page_views').insert(pageViews)
  }

  // Update views_count on the article
  await supabase.from('articles').update({ views_count: totalViews }).eq('id', articleId)
}
