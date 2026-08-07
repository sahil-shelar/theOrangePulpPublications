'use client'

import { useState } from 'react'
import { Ban, Trash2, CheckCircle } from 'lucide-react'
import { updateUserRole, disableUser, enableUser, deleteUser } from '@/lib/actions/users'

type User = {
  id: string
  email?: string
  created_at?: string
  email_confirmed_at?: string | null
  banned_until?: string | null
  /* Role lives in app_metadata, which only the service-role admin API can write.
     user_metadata is client-writable — a user could set their own role there. */
  app_metadata?: { role?: string }
}

export default function UserRow({ u, isYou }: { u: User; isYou: boolean }) {
  const role = u.app_metadata?.role || 'writer'
  const isBanned = !!u.banned_until
  const pending = !u.email_confirmed_at
  const [busy, setBusy] = useState(false)

  const date = u.created_at
    ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  async function handleRole(e: React.ChangeEvent<HTMLSelectElement>) {
    setBusy(true)
    await updateUserRole(u.id, e.target.value)
    setBusy(false)
  }

  async function handleBan() {
    setBusy(true)
    if (isBanned) await enableUser(u.id)
    else await disableUser(u.id)
    setBusy(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete ${u.email} permanently? This cannot be undone.`)) return
    setBusy(true)
    await deleteUser(u.id)
    setBusy(false)
  }

  return (
    <tr className={`border-t-[3px] border-foreground transition-colors ${isYou ? 'bg-secondary/40' : 'hover:bg-muted'} ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
      <td className="p-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary border-[2px] border-foreground flex items-center justify-center font-heading font-black text-xs shrink-0">
            {u.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-sm font-bold truncate max-w-[180px]">{u.email}</div>
            {isYou && <div className="text-label font-black uppercase tracking-widest text-muted-foreground">You</div>}
          </div>
        </div>
      </td>
      <td className="p-3.5">
        {isYou ? (
          <span className="text-label font-black uppercase tracking-widest bg-foreground text-background px-2 py-0.5">{role}</span>
        ) : (
          <select
            defaultValue={role}
            onChange={handleRole}
            className="bg-background border-[2px] border-foreground px-2 py-1 text-label font-black uppercase tracking-widest"
          >
            <option value="writer">Writer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        )}
      </td>
      <td className="p-3.5 hidden sm:table-cell">
        <span className={`text-label font-black uppercase tracking-widest px-2 py-0.5 border-[2px] ${
          isBanned ? 'bg-primary text-primary-foreground border-foreground' :
          pending ? 'bg-muted text-muted-foreground border-foreground/30' :
          'bg-background text-muted-foreground border-foreground/20'
        }`}>
          {isBanned ? 'Banned' : pending ? 'Pending' : 'Active'}
        </span>
      </td>
      <td className="p-3.5 hidden md:table-cell text-label font-bold text-muted-foreground">{date}</td>
      <td className="p-3.5 text-right">
        {!isYou && (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={handleBan}
              title={isBanned ? 'Unban' : 'Ban'}
              className="p-1.5 border-[2px] border-foreground hover:bg-primary transition-colors"
            >
              {isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
            </button>
            <button
              onClick={handleDelete}
              title="Delete"
              className="p-1.5 border-[2px] border-foreground hover:bg-primary transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
