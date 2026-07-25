import { supabase } from '../seed/config';
// The instruction stated to run generateHistoricalAnalytics from ../seed/analytics
import { generateHistoricalAnalytics } from '../seed/analytics';

export async function seedAnalytics() {
  console.log('Seeding analytics via historical generation...');

  // Fetch all articles
  const { data: articles, error: articlesError } = await supabase.from('articles').select('id, slug, type');
  
  if (articlesError || !articles?.length) {
    console.error('Failed to fetch articles for analytics seeding.', articlesError);
    return;
  }

  console.log(`Found ${articles.length} articles. Generating historical analytics for each...`);

  let successCount = 0;

  for (const article of articles) {
    try {
      // Run the requested function for each article to populate page_views and update views_count
      await generateHistoricalAnalytics(article.id, article.slug, article.type);
      successCount++;
    } catch (err) {
      console.error(`Error generating analytics for article ${article.id}:`, err);
    }
  }

  console.log(`Successfully completed generating historical analytics for ${successCount} out of ${articles.length} articles.`);
}

if (require.main === module) {
  seedAnalytics().then(() => process.exit(0)).catch(console.error);
}
