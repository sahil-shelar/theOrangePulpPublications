-- Increase storage bucket file size limits to 25MB (26214400 bytes)
UPDATE storage.buckets SET file_size_limit = 26214400
WHERE id IN ('article-images', 'movie-posters');

-- Backdrops get 50MB — full-res cinematic images
UPDATE storage.buckets SET file_size_limit = 52428800
WHERE id = 'movie-backdrops';

-- Avatars and site assets stay at 10MB (up from 5MB)
UPDATE storage.buckets SET file_size_limit = 10485760
WHERE id IN ('author-avatars', 'site-assets');
