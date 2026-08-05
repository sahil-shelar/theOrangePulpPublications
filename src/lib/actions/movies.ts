'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

const ROLE_RANK: Record<string, number> = { admin: 3, editor: 2, writer: 1 }
const hasRole = (user: any, minRole: string) =>
  (ROLE_RANK[user?.user_metadata?.role ?? 'writer'] ?? 1) >= (ROLE_RANK[minRole] ?? 1)

export async function createMovie(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'editor')) throw new Error("Forbidden: Editor or above required")

  const payload = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    synopsis: formData.get('synopsis') as string,
    poster_url: formData.get('poster_url') as string,
    backdrop_url: formData.get('backdrop_url') as string,
    runtime: formData.get('runtime') ? parseInt(formData.get('runtime') as string) : null,
    director: formData.get('director') as string,
  }

  const { error } = await supabase.from('movies').insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/movies')
  updateTag('movies')
  redirect('/dashboard/movies')
}

export async function updateMovie(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'editor')) throw new Error("Forbidden: Editor or above required")

  const payload = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    synopsis: formData.get('synopsis') as string,
    poster_url: formData.get('poster_url') as string,
    backdrop_url: formData.get('backdrop_url') as string,
    runtime: formData.get('runtime') ? parseInt(formData.get('runtime') as string) : null,
    director: formData.get('director') as string,
  }

  const { error } = await supabase.from('movies').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/movies')
  updateTag('movies')
  redirect('/dashboard/movies')
}

export async function deleteMovie(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'admin')) throw new Error("Forbidden: Admin only")

  const { error } = await supabase.from('movies').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/movies')
  updateTag('movies')
}
