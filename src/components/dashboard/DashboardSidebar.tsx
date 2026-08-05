'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import {
  LayoutDashboard, FileText, UserSquare, LayoutGrid, Tag, Film,
  Image as ImageIcon, Mail, Sparkles, Server, ShieldCheck, Settings,
  Activity, LogOut, Code
} from 'lucide-react'

// minRole: which roles can see this item
// admin > editor > writer
const ROLE_RANK: Record<string, number> = { admin: 3, editor: 2, writer: 1 }
const canAccess = (userRole: string | undefined, minRole: string) =>
  (ROLE_RANK[userRole ?? 'writer'] ?? 1) >= (ROLE_RANK[minRole] ?? 1)

const NAV = [
  {
    section: 'Content',
    minRole: 'writer',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true, minRole: 'writer' },
      { href: '/dashboard/articles', icon: FileText, label: 'Articles', minRole: 'writer' },
      { href: '/dashboard/authors', icon: UserSquare, label: 'Authors', minRole: 'editor' },
      { href: '/dashboard/categories', icon: LayoutGrid, label: 'Categories', minRole: 'admin' },
      { href: '/dashboard/tags', icon: Tag, label: 'Tags', minRole: 'editor' },
      { href: '/dashboard/movies', icon: Film, label: 'Movies', minRole: 'editor' },
    ],
  },
  {
    section: 'Library',
    minRole: 'writer',
    items: [
      { href: '/dashboard/media', icon: ImageIcon, label: 'Media', minRole: 'writer' },
      { href: '/dashboard/newsletter', icon: Mail, label: 'Newsletter', minRole: 'editor' },
    ],
  },
  {
    section: 'Intelligence',
    minRole: 'editor',
    items: [
      { href: '/dashboard/ai', icon: Sparkles, label: 'AI Center', minRole: 'editor' },
    ],
  },
  {
    section: 'Admin',
    minRole: 'admin',
    items: [
      { href: '/dashboard/users', icon: ShieldCheck, label: 'Users', minRole: 'admin' },
      { href: '/dashboard/jobs', icon: Server, label: 'Jobs', minRole: 'admin' },
      { href: '/dashboard/system', icon: Activity, label: 'System', minRole: 'admin' },
      { href: '/dashboard/developer', icon: Code, label: 'Developer', minRole: 'admin' },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings', minRole: 'admin' },
    ],
  },
]

type Props = {
  userEmail?: string
  userRole?: string
  onNavigate?: () => void
}

export default function DashboardSidebar({ userEmail, userRole, onNavigate }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-64 shrink-0 border-r-[3px] border-foreground bg-muted flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV.filter(s => canAccess(userRole, s.minRole)).map(({ section, items }) => (
          <div key={section}>
            <div className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1">
              {section}
            </div>
            <div className="space-y-0.5">
              {items.filter(i => canAccess(userRole, i.minRole)).map(({ href, icon: Icon, label, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all border-l-[3px] ${
                      active
                        ? 'bg-primary text-primary-foreground border-foreground shadow-hard-sm'
                        : 'text-foreground/70 border-transparent hover:bg-background hover:text-foreground hover:border-foreground/30'
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t-[3px] border-foreground p-4 space-y-3">
        <div className="px-1">
          <div className="text-xs font-black text-foreground truncate">{userEmail || '—'}</div>
          <div className="text-label font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            {userRole || 'editor'}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-background text-foreground border-[3px] border-foreground px-4 py-2.5 text-label font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Logout
          </button>
        </form>
      </div>
    </aside>
  )
}
