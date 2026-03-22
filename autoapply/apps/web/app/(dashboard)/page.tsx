import { createClient } from '@/lib/supabase/server'
import { PipelineKanban } from '@/components/dashboard/PipelineKanban'
import { StatsBar } from '@/components/dashboard/StatsBar'
import type { ApplicationWithJob } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: applications } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('user_id', user!.id)
    .order('last_activity_at', { ascending: false })

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Application Pipeline</h1>
          <p className="text-sm text-on-surface-muted mt-1">
            Manage your active pursuits across strategic stages.
          </p>
        </div>
        <StatsBar applications={(applications ?? []) as ApplicationWithJob[]} jobCount={jobCount ?? 0} />
      </div>
      <PipelineKanban applications={(applications ?? []) as ApplicationWithJob[]} />
    </div>
  )
}
