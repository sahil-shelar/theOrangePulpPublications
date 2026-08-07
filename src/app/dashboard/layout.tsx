import { getCurrentUser } from '@/lib/api/auth'
import CommandPalette from '@/components/dashboard/CommandPalette'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardMobileHeader from '@/components/dashboard/DashboardMobileHeader'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <CommandPalette />

      {/* Sidebar — visible md+ */}
      <div className="hidden md:flex">
        <DashboardSidebar
          userEmail={user?.email}
          userRole={user?.app_metadata?.role}
        />
      </div>

      {/* Mobile slide-over nav */}
      <DashboardMobileHeader
        userEmail={user?.email}
        userRole={user?.app_metadata?.role}
      />

      {/* Main — extra top padding on mobile to clear the fixed mobile header */}
      <main className="flex-1 min-h-screen overflow-y-auto pt-[49px] md:pt-0">
        {children}
      </main>
    </div>
  )
}
