'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') throw new Error("Forbidden")
  return user
}

export async function inviteUser(formData: FormData) {
  await requireAdmin()

  const email = formData.get('email') as string
  const role = (formData.get('role') as string) || 'writer'

  if (!email) return { error: 'Email is required' }
  if (!['admin', 'editor', 'writer'].includes(role)) return { error: 'Invalid role' }

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${siteUrl}/dashboard`,
  })

  if (error) return { error: error.message || error.code || JSON.stringify(error) }

  revalidatePath('/dashboard/users')
  return { success: true, userId: data.user?.id }
}

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin()

  if (!['admin', 'editor', 'writer'].includes(role)) return { error: 'Invalid role' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function disableUser(userId: string) {
  await requireAdmin()

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: '876000h', // ~100 years
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function enableUser(userId: string) {
  await requireAdmin()

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireAdmin()

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function listUsers() {
  await requireAdmin()

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.listUsers()

  if (error) return { error: error.message, users: [] }
  return { users: data.users }
}
