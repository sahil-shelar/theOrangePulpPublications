// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { handleSupabaseError } from '@/utils/supabase-error'
import { revalidatePath, revalidateTag } from 'next/cache'

type ArticleInsert = Database['public']['Tables']['articles']['Insert']
type ArticleUpdate = Database['public']['Tables']['articles']['Update']

const ROLE_RANK: Record<string, number> = { admin: 3, editor: 2, writer: 1 }
const hasRole = (user: any, minRole: string) =>
  (ROLE_RANK[user?.user_metadata?.role ?? 'writer'] ?? 1) >= (ROLE_RANK[minRole] ?? 1)

export async function createArticle(data: ArticleInsert) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Writers can only save drafts, never publish directly
  if (!hasRole(user, 'editor') && data.status === 'published') {
    data = { ...data, status: 'draft' }
  }

  const { data: article, error } = await supabase
    .from('articles')
    .insert(data)
    .select()
    .single()

  if (error) return handleSupabaseError(error)

  revalidatePath('/')
  revalidateTag('articles')
  return { data: article }
}

export async function updateArticle(id: string, data: ArticleUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Writers cannot publish
  if (!hasRole(user, 'editor') && data.status === 'published') {
    return { error: 'Writers cannot publish articles. Submit for review instead.' }
  }

  const { data: article, error } = await supabase
    .from('articles')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return handleSupabaseError(error)

  revalidatePath('/')
  revalidateTag('articles')
  if (article.slug) revalidatePath(`/${article.type}s/${article.slug}`)
  return { data: article }
}

export async function deleteArticle(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  if (!hasRole(user, 'admin')) {
    throw new Error("Forbidden: Only admins can delete articles")
  }

  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return handleSupabaseError(error)

  revalidatePath('/')
  revalidateTag('articles')
  return { success: true }
}

export async function incrementViewCount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_view_count', { article_id: id })
  if (error) return handleSupabaseError(error)
  return { success: true }
}
