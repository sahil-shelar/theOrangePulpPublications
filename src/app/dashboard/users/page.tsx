// @ts-nocheck
import { getCurrentUser } from '@/lib/api/auth'
import { listUsers, inviteUser } from '@/lib/actions/users'
import { redirect } from 'next/navigation'
import { Mail, ShieldCheck } from 'lucide-react'
import UserRow from '@/components/dashboard/UserRow'

export const metadata = { title: 'Users — Dashboard' }

export default async function UsersDashboardPage() {
  const user = await getCurrentUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/dashboard')

  const { users = [], error: listError } = await listUsers()

  const sorted = [...users].sort((a, b) =>
    a.id === user.id ? -1 : b.id === user.id ? 1 : 0
  )

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-0.5">Admin</p>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">Users</h1>
        <p className="text-xs text-foreground/50 mt-1 font-bold uppercase tracking-widest">
          {users.length} member{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Invite Form */}
      <div className="brutal-card bg-secondary p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail size={18} />
          <h2 className="font-heading text-lg font-black uppercase tracking-widest">Invite New Member</h2>
        </div>
        <form action={inviteUser} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            name="email"
            required
            placeholder="colleague@email.com"
            className="flex-1 bg-background border-[3px] border-foreground px-4 py-2.5 text-sm font-bold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            name="role"
            className="bg-background border-[3px] border-foreground px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary uppercase tracking-widest"
          >
            <option value="writer">Writer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="brutal-button px-6 py-2.5 text-xs flex items-center gap-2 justify-center whitespace-nowrap">
            <Mail size={14} /> Send Invite
          </button>
        </form>
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mt-3">
          Invitee receives a setup email. No public signup available.
        </p>
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { role: 'admin', desc: 'Full access · user management · settings' },
          { role: 'editor', desc: 'Publish articles · manage taxonomy' },
          { role: 'writer', desc: 'Create & submit drafts only' },
        ].map(({ role, desc }) => (
          <div key={role} className="flex items-center gap-2 brutal-card bg-background px-3 py-2">
            <span className="text-[9px] font-black uppercase tracking-widest bg-foreground text-background px-2 py-0.5">{role}</span>
            <span className="text-[10px] font-bold text-foreground/50 hidden sm:block">{desc}</span>
          </div>
        ))}
      </div>

      {/* Users table */}
      {listError ? (
        <div className="brutal-card bg-background p-6 border-l-[4px] border-primary text-sm font-bold text-foreground/60">
          Could not load users: {listError}
        </div>
      ) : (
        <div className="brutal-card bg-background p-0 overflow-hidden">
          <div className="bg-foreground text-background p-4 flex items-center gap-3">
            <ShieldCheck size={16} />
            <h2 className="font-heading text-lg font-black uppercase tracking-widest">All Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b-[3px] border-foreground text-[9px] font-black uppercase tracking-widest bg-muted text-foreground/60">
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5 hidden sm:table-cell">Status</th>
                  <th className="p-3.5 hidden md:table-cell">Joined</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center font-bold text-foreground/40 uppercase tracking-widest text-xs">
                      No users found
                    </td>
                  </tr>
                ) : sorted.map((u) => (
                  <UserRow key={u.id} u={u} isYou={u.id === user.id} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
