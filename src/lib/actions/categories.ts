'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

const ROLE_RANK: Record<string, number> = { admin: 3, editor: 2, writer: 1 }
const hasRole = (user: any, minRole: string) =>
  (ROLE_RANK[user?.app_metadata?.role ?? 'writer'] ?? 1) >= (ROLE_RANK[minRole] ?? 1)

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'admin')) throw new Error("Forbidden: Admin only")

  const payload = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
  }

  const { error } = await supabase.from('categories').insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/categories')
  updateTag('categories')
  redirect('/dashboard/categories')
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'admin')) throw new Error("Forbidden: Admin only")

  const payload = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
  }

  const { error } = await supabase.from('categories').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/categories')
  updateTag('categories')
  redirect('/dashboard/categories')
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'admin')) throw new Error("Forbidden: Admin only")

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/categories')
  updateTag('categories')
}
