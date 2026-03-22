import { createClient } from '@/lib/supabase/server'
import { DashboardView } from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user!.id)

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <DashboardView
      applications={applications ?? []}
      jobCount={jobCount ?? 0}
    />
  )
}
