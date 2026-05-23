import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { StaggerFeed } from '@/components/dashboard/StaggerFeed'
import { MatIcon } from '@/components/ui/mat-icon'
import type { ApplicationWithJob } from '@/lib/types'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const BASE_FIELDS = [
  'first_name', 'last_name', 'linkedin_url', 'github_url', 'portfolio_url',
  'date_of_birth', 'open_to_relocation', 'work_arrangement', 'available_from',
] as const

function computeReadinessPct(base: Record<string, unknown>, hasRegional: boolean): number {
  const filled = BASE_FIELDS.filter(f => base[f] !== null && base[f] !== undefined && base[f] !== '').length
  const total = BASE_FIELDS.length + 1
  return Math.round(((filled + (hasRegional ? 1 : 0)) / total) * 100)
}

const ACTIVITY_LOG = [
  { icon: 'check_circle', color: 'bg-success-vibrant', label: 'Applied to Stripe', time: '2h ago' },
  { icon: 'mail', color: 'bg-primary-container', label: 'OA invite from Rippling', time: '5h ago' },
  { icon: 'videocam', color: 'bg-tertiary-container', label: 'Interview scheduled', time: '1d ago' },
  { icon: 'star', color: 'bg-warning-vibrant', label: 'Profile updated', time: '2d ago' },
  { icon: 'sync', color: 'bg-outline', label: 'Feed synced — 24 new jobs', time: '3d ago' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [appsRes, baseRes, regionalRes] = await Promise.all([
    supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .eq('user_id', user!.id)
      .order('last_activity_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
    supabase.from('user_regional_identities').select('id').eq('user_id', user!.id).limit(1),
  ])

  const applications = (appsRes.data ?? []) as ApplicationWithJob[]
  const base = (baseRes.data ?? {}) as Record<string, unknown>
  const hasRegional = (regionalRes.data ?? []).length > 0
  const readinessPct = computeReadinessPct(base, hasRegional)

  const total = applications.length
  const thisWeek = applications.filter(a => a.applied_at && a.applied_at >= oneWeekAgo).length
  const advanced = applications.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length
  const successRate = total > 0 ? Math.round((advanced / total) * 100) : 0
  const recentApps = applications.slice(0, 8)

  return (
    <div className="p-8 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={total}
          icon={<MatIcon size={18}>work</MatIcon>}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          label="Applied This Week"
          value={thisWeek}
          icon={<MatIcon size={18}>schedule</MatIcon>}
          iconClassName="bg-warning-vibrant/10 text-warning-vibrant"
        />
        <StatCard
          label="Progressed Rate"
          value={total > 0 ? `${successRate}%` : '—'}
          icon={<MatIcon size={18}>emoji_events</MatIcon>}
          iconClassName="bg-success-vibrant/10 text-success-vibrant"
        />
        <StatCard
          label="Profile Readiness"
          value={`${readinessPct}%`}
          icon={<MatIcon size={18}>person</MatIcon>}
          iconClassName="bg-tertiary/10 text-tertiary"
        />
      </div>

      {/* Main grid: 12 cols */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Applications — 8 cols */}
        <div className="col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-display text-on-surface">Recent Applications</h2>
            <Link href="/applications" className="text-xs text-primary hover:underline">View all</Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="bg-surface-card rounded-xl border border-outline-variant p-10 text-center">
              <p className="text-on-surface-variant text-sm">No applications yet. Use the extension to auto-fill your first one.</p>
            </div>
          ) : (
            <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card divide-y divide-outline-variant/30 overflow-hidden">
              <StaggerFeed>
                {recentApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-xs font-semibold text-on-surface-variant shrink-0">
                      {((app.job as { company?: string } | null)?.company ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {(app.job as { company?: string } | null)?.company ?? 'Unknown Company'}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {(app.job as { title?: string } | null)?.title ?? 'Unknown Role'}
                      </p>
                    </div>
                    <Badge status={app.status}>{app.status}</Badge>
                    <span className="text-xs text-outline shrink-0 w-16 text-right">
                      {app.applied_at ? timeAgo(app.applied_at) : '—'}
                    </span>
                    <MatIcon size={14} className="text-outline/40 group-hover:text-outline transition-colors shrink-0">chevron_right</MatIcon>
                  </Link>
                ))}
              </StaggerFeed>
            </div>
          )}
        </div>

        {/* Activity Log — 4 cols */}
        <div className="col-span-4 space-y-3">
          <h2 className="text-base font-semibold font-display text-on-surface">Activity</h2>
          <div className="bg-surface-card rounded-xl border border-outline-variant p-5">
            <div className="relative space-y-0">
              {/* Vertical connector */}
              <div className="absolute left-[11px] top-4 bottom-4 w-[1px] bg-outline-variant/40" />

              {ACTIVITY_LOG.map((item, i) => (
                <div key={i} className="relative flex items-start gap-3 py-3">
                  <div className={`relative z-10 w-5 h-5 rounded-full ${item.color} flex items-center justify-center shrink-0 border-2 border-surface-card`}>
                    <MatIcon size={11} className="text-white">{item.icon}</MatIcon>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-on-surface leading-snug">{item.label}</p>
                    <p className="text-xs text-outline mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
