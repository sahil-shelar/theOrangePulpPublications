import { supabase } from '../seed/config';
import { getDeterministicUuid, getRandomDate, getRandomElement } from '../seed/helpers';

export async function seedMedia() {
  console.log('Seeding media library...');

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, poster_url, backdrop_url')
    .limit(200);

  if (!movies?.length) {
    console.log('No movies found. Run --movies seeder first.');
    return;
  }

  const { data: authors } = await supabase.from('authors').select('id');

  const mediaEntries = [];

  for (const movie of movies) {
    if (movie.poster_url) {
      mediaEntries.push({
        id: getDeterministicUuid(`media-poster-${movie.id}`),
        file_name: `${movie.id}-poster.jpg`,
        file_url: movie.poster_url,
        alt_text: `${movie.title} poster`,
        mime_type: 'image/jpeg',
        size_bytes: null,
        uploaded_by: authors?.length ? getRandomElement(authors).id : null,
        created_at: getRandomDate(365).toISOString(),
      });
    }
    if (movie.backdrop_url) {
      mediaEntries.push({
        id: getDeterministicUuid(`media-backdrop-${movie.id}`),
        file_name: `${movie.id}-backdrop.jpg`,
        file_url: movie.backdrop_url,
        alt_text: `${movie.title} backdrop`,
        mime_type: 'image/jpeg',
        size_bytes: null,
        uploaded_by: authors?.length ? getRandomElement(authors).id : null,
        created_at: getRandomDate(365).toISOString(),
      });
    }
  }

  if (mediaEntries.length === 0) {
    console.log('No media URLs found on movies. Skipping.');
    return;
  }

  const chunkSize = 50;
  let successCount = 0;
  for (let i = 0; i < mediaEntries.length; i += chunkSize) {
    const chunk = mediaEntries.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('media')
      .upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Error seeding media chunk:', error.message);
    } else {
      successCount += chunk.length;
    }
  }

  console.log(`Seeded ${successCount} media entries.`);
}
