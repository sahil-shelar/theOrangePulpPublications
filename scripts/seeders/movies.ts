import { supabase } from '../seed/config';
import { fetchTmdbList, getTmdbDetails } from '../seed/tmdb';
import { downloadAndStoreImage } from '../seed/storage';
import { getRandomElement, getDeterministicUuid } from '../seed/helpers';

export async function seedMovies() {
  console.log('Seeding movies and tv shows...');
  
  const mediaList = [];
  
  // Fetch 500 movies (25 pages of 20 results)
  for (let page = 1; page <= 25; page++) {
    try {
      const data = await fetchTmdbList('movie', 'popular', page);
      if (data && data.length > 0) {
        mediaList.push(...data.map((r: any) => ({ ...r, media_type: 'movie' })));
      }
    } catch (err) {
      console.error(`Failed to fetch movie page ${page}`, err);
    }
  }
  
  // Fetch 200 TV shows (10 pages of 20 results)
  for (let page = 1; page <= 10; page++) {
    try {
      const data = await fetchTmdbList('tv', 'popular', page);
      if (data && data.length > 0) {
        mediaList.push(...data.map((r: any) => ({ ...r, media_type: 'tv' })));
      }
    } catch (err) {
      console.error(`Failed to fetch tv page ${page}`, err);
    }
  }
  
  console.log(`Fetched ${mediaList.length} items from TMDb lists. Processing details...`);
  
  // Process in batches of 10 to speed up execution while avoiding severe rate limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < mediaList.length; i += BATCH_SIZE) {
    const batch = mediaList.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (media) => {
      try {
        const details = await getTmdbDetails(media.media_type, media.id);
        if (!details) return;

        const title = details.title || details.name;
        const releaseDate = details.release_date || details.first_air_date;
        const release_year = releaseDate ? parseInt(releaseDate.substring(0, 4)) : null;
        
        let director = null;
        if (details.credits?.crew) {
          const dirObj = details.credits.crew.find((c: any) => c.job === 'Director');
          if (dirObj) director = dirObj.name;
        }
        if (!director && details.created_by && details.created_by.length > 0) {
          director = details.created_by[0].name;
        }

        let poster_url = null;
        if (details.poster_path) {
          poster_url = await downloadAndStoreImage(
            `https://image.tmdb.org/t/p/original${details.poster_path}`,
            'movie-posters',
            `${details.id}.jpg`
          );
        }
        
        let backdrop_url = null;
        if (details.backdrop_path) {
          backdrop_url = await downloadAndStoreImage(
            `https://image.tmdb.org/t/p/original${details.backdrop_path}`,
            'movie-backdrops',
            `${details.id}.jpg`
          );
        }
        
        let certification = null;
        if (details.release_dates?.results) {
          const usRelease = details.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
          if (usRelease && usRelease.release_dates?.length > 0) {
            certification = usRelease.release_dates[0].certification;
          }
        } else if (details.content_ratings?.results) {
          const usRating = details.content_ratings.results.find((r: any) => r.iso_3166_1 === 'US');
          if (usRating) {
            certification = usRating.rating;
          }
        }
        
        const metadata = {
          genres: details.genres?.map((g: any) => g.name) || [],
          cast: details.credits?.cast?.slice(0, 10).map((c: any) => c.name) || [],
          certification,
          overview: details.overview,
          vote_average: details.vote_average,
          media_type: media.media_type
        };
        
        const payload = {
          tmdb_id: details.id,
          title,
          release_year,
          director,
          poster_url,
          backdrop_url,
          metadata
        };
        
        const { error } = await supabase
          .from('movies')
          .upsert(payload, { onConflict: 'tmdb_id' });
          
        if (error) {
          console.error(`Error upserting ${title}:`, error.message);
        }
        
      } catch (error) {
        console.error(`Error processing media ${media.id}:`, error);
      }
    }));
    console.log(`Processed ${Math.min(i + BATCH_SIZE, mediaList.length)} of ${mediaList.length} items...`);
  }
  
  console.log('Finished seeding movies.');
}
