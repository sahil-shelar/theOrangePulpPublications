import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

// React cache() deduplicates within one render (generateMetadata + page share single DB hit)
export const getCategoryBySlug = cache(async (slug: string) => {
  const supabase = createPublicClient()
  const { data } = await supabase.from('categories').select('*').eq('slug', slug).single()
  return data ?? null
})

export const getAuthorBySlug = cache(async (slug: string) => {
  const supabase = createPublicClient()
  const { data } = await supabase.from('authors').select('*').eq('slug', slug).single()
  return data ?? null
})

export const getTagBySlug = cache(async (slug: string) => {
  const supabase = createPublicClient()
  const { data } = await supabase.from('tags').select('*').eq('slug', slug).single()
  return data ?? null
})

// unstable_cache for list pages — cached across requests
export const getCategories = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    return data ?? []
  },
  ['all-categories'],
  { revalidate: 300, tags: ['categories'] }
)

export const getAuthors = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('authors').select('*').order('name')
    return data ?? []
  },
  ['all-authors'],
  { revalidate: 300, tags: ['authors'] }
)

export const getMovies = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('movies').select('*').order('title')
    return data ?? []
  },
  ['all-movies'],
  { revalidate: 300, tags: ['movies'] }
)

export const getTags = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('tags').select('*').order('name')
    return data ?? []
  },
  ['all-tags'],
  { revalidate: 300, tags: ['tags'] }
)
