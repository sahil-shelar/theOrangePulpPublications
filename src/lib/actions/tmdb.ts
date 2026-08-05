'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTmdbMovieDetails, parseTmdbToInternalMovie } from '@/lib/services/tmdb'

export async function importTmdbMovie(tmdbId: string | number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. Fetch raw TMDb data
  const rawData = await getTmdbMovieDetails(tmdbId)
  if (!rawData) throw new Error("Failed to fetch TMDb details")

  // 2. Parse into internal format
  const parsedData = parseTmdbToInternalMovie(rawData)
  if (!parsedData) throw new Error("Failed to parse TMDb metadata")

  // 3. Upsert into database
  // Assuming 'tmdb_id' has a unique constraint if we use upsert, 
  // or we simply insert and let the UI handle uniqueness via search
  
  const year = parsedData.release_date?.split('-')[0]
  const slug = parsedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + (year ? '-' + year : '')

  const payload = {
    title:          parsedData.title,
    original_title: parsedData.original_title,
    slug,
    synopsis:       parsedData.synopsis,
    poster_url:     parsedData.poster_url,
    backdrop_url:   parsedData.backdrop_url,
    runtime:        parsedData.runtime,
    release_date:   parsedData.release_date || null,
    release_year:   year ? parseInt(year, 10) : null,
    director:       parsedData.director,
    trailer_url:    parsedData.trailer_url,
    certification:  parsedData.certification,
    tmdb_id:        parsedData.tmdb_id,
    metadata:       parsedData.metadata,
  }

  const { data: inserted, error } = await supabase
    .from('movies')
    .upsert(payload, { onConflict: 'tmdb_id', ignoreDuplicates: false })
    .select()
    .single()

  if (error) {
    console.error("Import error:", error.message)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/movies')
  return inserted
}
