import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex">
      <nav className="w-48 border-r p-4 space-y-1 shrink-0">
        <p className="font-bold text-sm mb-4">AutoApply</p>
        <Link href="/"             className="block p-2 rounded text-sm hover:bg-accent">Dashboard</Link>
        <Link href="/jobs"         className="block p-2 rounded text-sm hover:bg-accent">Jobs</Link>
        <Link href="/applications" className="block p-2 rounded text-sm hover:bg-accent">Applications</Link>
        <Link href="/profile"      className="block p-2 rounded text-sm hover:bg-accent">Profile</Link>
      </nav>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
