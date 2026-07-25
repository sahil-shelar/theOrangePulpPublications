// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'

const ROLE_RANK: Record<string, number> = { admin: 3, editor: 2, writer: 1 }
const hasRole = (user: any, minRole: string) =>
  (ROLE_RANK[user?.user_metadata?.role ?? 'writer'] ?? 1) >= (ROLE_RANK[minRole] ?? 1)

export async function createTag(data: { name: string, slug: string, description?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'editor')) throw new Error("Forbidden: Editor or above required")

  const { error } = await supabase.from('tags').insert(data)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/tags')
  revalidateTag('tags')
}

export async function updateTag(id: string, data: { name?: string, slug?: string, description?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'editor')) throw new Error("Forbidden: Editor or above required")

  const { error } = await supabase.from('tags').update(data).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/tags')
  revalidateTag('tags')
}

export async function deleteTag(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'admin')) throw new Error("Forbidden: Admin only")

  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/tags')
  revalidateTag('tags')
}
