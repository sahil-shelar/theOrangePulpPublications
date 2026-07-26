// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { STORAGE_BUCKETS } from '@/lib/api/storage'
import { revalidatePath } from 'next/cache'

// Lightweight action — only registers metadata after browser-side upload
// The actual file never passes through Vercel (bypasses 4.5MB body limit)
export async function registerMediaRecord(
  fileName: string,
  fileUrl: string,
  mimeType: string,
  sizeBytes: number,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase.from('media').insert({ file_name: fileName, file_url: fileUrl, mime_type: mimeType, size_bytes: sizeBytes })
  revalidatePath('/dashboard/media')
  return { success: true, url: fileUrl }
}

export async function deleteMediaAction(id: string, fileName: string, bucket: string = STORAGE_BUCKETS.ARTICLES) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  // Future: Check if Admin or if uploader is the current user.
  if (user.user_metadata?.role !== 'admin') {
    // Only admins can delete for now until user mapping is finalized
    return { error: 'Forbidden: Only Admins can delete media' }
  }

  const { error: storageError } = await supabase.storage.from(bucket).remove([fileName])
  if (storageError) return { error: storageError.message }

  const { error: dbError } = await supabase.from('media').delete().eq('id', id)
  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/media')
  return { success: true }
}
