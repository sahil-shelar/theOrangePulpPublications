import { supabase } from '../seed/config';
import { generateSlug, getRandomElement, getRandomDate, getDeterministicUuid } from '../seed/helpers';
import { ARTICLE_SEED_PLAN } from '../seed/article-plan';
import { generateTitle, generateContent, generateSeo, generateRating } from '../seed/ai';

export async function seedArticles() {
  console.log('Seeding articles...');

  // 1. Fetch related data
  const { data: categories } = await supabase.from('categories').select('id, slug');
  const { data: tags } = await supabase.from('tags').select('id');
  const { data: authors } = await supabase.from('authors').select('id');
  const { data: movies } = await supabase.from('movies').select('id');

  // Defined in ../seed/article-plan so backfill-origins.ts can recompute exactly
  // these ids. Do not inline it back — the two drifting apart would leave seeded
  // articles classified as production data and live on the real site.
  const articleTypes = ARTICLE_SEED_PLAN;

  const articlesToUpsert = [];
  const articleTagsToInsert = [];

  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
  const endDate = new Date();

  for (const { type, count, seedKey } of articleTypes) {
    for (let i = 0; i < count; i++) {
      const title = await generateTitle(type);
      const slug = generateSlug(`${title}-${i}`);
      const content = await generateContent(type);
      const seo = await generateSeo(title);
      const rating = type === 'review' ? await generateRating() : null;

      const author = authors && authors.length > 0 ? getRandomElement(authors) : null;
      // Try to find a matching category, else pick randomly
      let category = categories?.find(c => c.slug === type);
      if (!category && categories && categories.length > 0) {
        category = getRandomElement(categories);
      }
      const movie = type === 'review' && movies && movies.length > 0 ? getRandomElement(movies) : null;

      // seedKey preserves deterministic UUID across type renames (e.g. 'feature'→'list')
      const articleId = getDeterministicUuid(`article-${seedKey}-${i}`);

      articlesToUpsert.push({
        id: articleId,
        title,
        slug,
        content,
        seo_title: seo.title,
        seo_description: seo.description,
        rating,
        type: type,
        status: 'published',
        // Seed rows are never visible on production, whatever their status. This
        // is what keeps 350 demo articles with no cover image off the live site;
        // they still render locally, which is what they are for.
        origin: 'seed',
        author_id: author?.id || null,
        category_id: category?.id || null,
        movie_id: movie?.id || null,
        published_at: getRandomDate(startDate, endDate),
      });

      // Assign random tags
      if (tags && tags.length > 0) {
        const numTags = Math.floor(Math.random() * 4) + 2; // 2 to 5 tags
        // Shuffle tags using basic logic
        const shuffledTags = [...tags].sort(() => 0.5 - Math.random());
        const selectedTags = shuffledTags.slice(0, numTags);
        for (const t of selectedTags) {
          articleTagsToInsert.push({
            article_id: articleId,
            tag_id: t.id
          });
        }
      }
    }
  }

  console.log(`Upserting ${articlesToUpsert.length} articles...`);
  
  // Upsert in chunks
  const chunkSize = 50;
  for (let i = 0; i < articlesToUpsert.length; i += chunkSize) {
    const chunk = articlesToUpsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('articles').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Error upserting articles chunk:', error.message);
    }
  }

  console.log(`Setting up ${articleTagsToInsert.length} article tags (idempotent)...`);
  
  // Clear existing tags for these articles first for idempotency
  for (let i = 0; i < articlesToUpsert.length; i += chunkSize) {
    const chunk = articlesToUpsert.slice(i, i + chunkSize);
    const chunkIds = chunk.map(a => a.id);
    const { error } = await supabase.from('article_tags').delete().in('article_id', chunkIds);
    if (error) {
      console.error('Error deleting old article tags:', error.message);
    }
  }

  // Insert new article tags
  for (let i = 0; i < articleTagsToInsert.length; i += chunkSize) {
    const chunk = articleTagsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('article_tags').insert(chunk);
    if (error) {
      console.error('Error inserting article_tags chunk:', error.message);
    }
  }

  console.log('Finished seeding articles.');
}
