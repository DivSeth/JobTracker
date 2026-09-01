import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopHeader } from '@/components/layout/TopHeader'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PageTransition } from '@/components/providers/PageTransition'
import { loadOpenNetworkAlerts } from '@/lib/knowledge-graph/summary'
import type { ReactNode } from 'react'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const alerts = await loadOpenNetworkAlerts(supabase, user.id)

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background mesh-gradient">
        <Sidebar userEmail={user?.email} />
        <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
          <TopHeader alerts={alerts} />
          <main className="flex-1 overflow-auto pt-14">
            <div className="p-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
