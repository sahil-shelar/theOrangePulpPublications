export const STORAGE_BUCKETS = {
  ARTICLES: 'article-images',
  AUTHORS: 'author-avatars',
  MOVIES: 'movie-posters',
  BACKDROPS: 'movie-backdrops',
  ASSETS: 'site-assets'
} as const;

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
