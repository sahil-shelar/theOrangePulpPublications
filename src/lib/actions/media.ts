// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { STORAGE_BUCKETS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/api/storage'
import { revalidatePath } from 'next/cache'

export async function uploadMediaAction(formData: FormData, bucket: string = STORAGE_BUCKETS.ARTICLES) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: 'Invalid file type. Only JPG, PNG, WEBP, and AVIF are allowed.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File size exceeds 25MB limit.' }
  }

  // Generate safe unique filename
  const ext = file.name.split('.').pop()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')
  const uniqueId = Math.random().toString(36).substring(2, 9)
  const fileName = `${Date.now()}_${uniqueId}_${safeName}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  })

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)

  // Register in media table (We ignore error if authors table doesn't map auth.id yet)
  await supabase.from('media').insert({
    file_name: fileName,
    file_url: publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
    // uploaded_by: user.id // Needs auth.users <-> authors mapping
  })

  revalidatePath('/dashboard/media')
  return { success: true, url: publicUrl, path: fileName }
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
