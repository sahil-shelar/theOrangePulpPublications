'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Role is read from `app_metadata`, never `user_metadata`.
//
// user_metadata is writable by the account it belongs to — any signed-in user
// can call `auth.updateUser({ data: { role: 'admin' } })` and grant themselves
// whatever they like. app_metadata can only be written by the service-role admin
// API, which is why every write below goes through createAdminClient().
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') throw new Error("Forbidden")
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
    redirectTo: `${siteUrl}/auth/confirm`,
  })

  if (error) return { error: error.message || String(error) || 'Invite failed' }

  // inviteUserByEmail's `data` option writes user_metadata, which the invitee
  // could then rewrite themselves. The role is set in a second call so it lands
  // in app_metadata instead.
  const userId = data.user?.id
  if (userId) {
    const { error: roleError } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    })
    // An invited account with no role would silently fall back to 'writer', so
    // report the failure rather than leaving it to be discovered later.
    if (roleError) return { error: `Invited ${email} but could not set their role: ${roleError.message}` }
  }

  revalidatePath('/dashboard/users')
  return { success: true, userId }
}

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin()

  if (!['admin', 'editor', 'writer'].includes(role)) return { error: 'Invalid role' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role },
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
