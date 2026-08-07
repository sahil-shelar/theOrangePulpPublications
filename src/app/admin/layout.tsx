import { getCurrentUser } from '@/lib/api/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/login')
  return <>{children}</>
}
