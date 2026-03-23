import { createClient } from '@/lib/supabase/server'
import { PipelineKanban } from '@/components/dashboard/PipelineKanban'
import { StatsBar } from '@/components/dashboard/StatsBar'
import type { ApplicationWithJob } from '@/lib/types'
import { Briefcase, Clock, Trophy, TrendingUp } from 'lucide-react'

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

  // Fetch status counts for stat cards
  const { data: statusRows } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', user!.id)

  const statusCounts = (statusRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})

  const totalApps = statusRows?.length ?? 0
  const offers = statusCounts['offer'] ?? 0
  const responseRate = totalApps > 0 ? Math.round((offers / totalApps) * 100) : 0
  const oaActive =
    (statusCounts['oa'] ?? 0) +
    (statusCounts['interview'] ?? 0) +
    (statusCounts['active'] ?? 0)

  const stats = [
    { label: 'Applied',       value: totalApps,              Icon: Briefcase   },
    { label: 'OA / Active',   value: oaActive,               Icon: Clock       },
    { label: 'Offers',        value: offers,                 Icon: Trophy      },
    { label: 'Response Rate', value: `${responseRate}%`,     Icon: TrendingUp  },
  ]

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

      {/* Mini stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-surface-card rounded-2xl p-4 shadow-ambient flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0053db]/10 flex items-center justify-center text-[#0053db]">
              <s.Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <PipelineKanban applications={(applications ?? []) as ApplicationWithJob[]} />
    </div>
  )
}
