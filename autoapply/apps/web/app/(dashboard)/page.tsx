import { createClient } from '@/lib/supabase/server'
import { ApplicationFunnel } from '@/components/dashboard/ApplicationFunnel'

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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {jobCount ?? 0} active job listings
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 border rounded-lg p-4">
          <ApplicationFunnel applications={applications ?? []} />
        </div>
        <div className="col-span-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            <strong>Phase 1 complete.</strong> Browse jobs and track applications manually.
          </p>
          <p className="text-sm text-muted-foreground">
            Email intelligence (OA detection, interview tracking) arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  )
}
