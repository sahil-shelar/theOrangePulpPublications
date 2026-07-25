import { supabase } from './config'

export async function downloadAndStoreImage(url: string, bucket: string, path: string) {
  try {
    // Check if already exists to ensure idempotency
    const { data: existing } = await supabase.storage.from(bucket).list(path.split('/').slice(0, -1).join('/'), {
      search: path.split('/').pop()
    })
    
    if (existing && existing.length > 0) {
      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
    }

    // Fetch from TMDB or external source
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch external image')
    const blob = await res.blob()

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: blob.type,
      upsert: true
    })

    if (error) {
      // If bucket does not exist, create it and retry once
      if (error.message && error.message.includes('Bucket not found')) {
        const { error: createErr } = await supabase.storage.createBucket(bucket, { public: true })
        if (createErr) throw createErr
        // Retry upload after creating bucket
        const retry = await supabase.storage.from(bucket).upload(path, blob, {
          contentType: blob.type,
          upsert: true
        })
        if (retry.error) throw retry.error
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      }
      throw error
    }

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  } catch (error) {
    console.warn(`Failed to store image ${url}:`, error)
    return url // Fallback to original URL
  }
}
