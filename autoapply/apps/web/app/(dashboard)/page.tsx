import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Briefcase, Clock, Trophy, Plug, ChevronRight } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Greeting } from '@/components/dashboard/Greeting'
import { StaggerFeed } from '@/components/dashboard/StaggerFeed'
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
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there'
  const recentApps = applications.slice(0, 8)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Greeting firstName={firstName} />
        <Link href="/applications/new">
          <Button variant="primary" size="md">New Application</Button>
        </Link>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={total}
          icon={<Briefcase size={18} />}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          label="Applied This Week"
          value={thisWeek}
          icon={<Clock size={18} />}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          label="Progressed Rate"
          value={total > 0 ? `${successRate}%` : '—'}
          icon={<Trophy size={18} />}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          label="Extension"
          value="Install"
          icon={<Plug size={18} />}
          iconClassName="bg-on-surface-muted/10 text-on-surface-muted"
        />
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Recent Applications feed (2/3) */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-base font-semibold font-display text-on-surface">Recent Applications</h2>
          {recentApps.length === 0 ? (
            <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-10 text-center">
              <p className="text-on-surface-muted text-sm">No applications yet. Use the extension to auto-fill your first one.</p>
            </div>
          ) : (
            <div className="bg-surface-card rounded-card border border-border-subtle shadow-card divide-y divide-border-subtle overflow-hidden">
              <StaggerFeed>
                {recentApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {(app.job as { company?: string } | null)?.company ?? 'Unknown Company'}
                      </p>
                      <p className="text-xs text-on-surface-muted truncate mt-0.5">
                        {(app.job as { title?: string } | null)?.title ?? 'Unknown Role'}
                      </p>
                    </div>
                    <Badge status={app.status}>{app.status}</Badge>
                    <span className="text-xs text-on-surface-muted shrink-0 w-16 text-right">
                      {app.applied_at ? timeAgo(app.applied_at) : '—'}
                    </span>
                    <ChevronRight size={14} className="text-on-surface-muted/40 group-hover:text-on-surface-muted transition-colors shrink-0" />
                  </Link>
                ))}
              </StaggerFeed>
            </div>
          )}
        </div>

        {/* Right: Profile readiness + Extension status (1/3) */}
        <div className="space-y-4">
          {/* Profile Readiness */}
          <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5 space-y-4">
            <h3 className="text-sm font-semibold font-display text-on-surface">Profile Readiness</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-muted">Completion</span>
                <span className="text-sm font-bold text-on-surface">{readinessPct}%</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${readinessPct}%` }}
                />
              </div>
              {readinessPct < 100 && (
                <p className="text-xs text-on-surface-muted pt-1">
                  Complete your profile to enable full auto-fill.
                </p>
              )}
            </div>
            <Link href="/profile">
              <Button variant="secondary" size="sm" className="w-full">
                {readinessPct === 100 ? 'View Profile' : 'Complete Profile'}
              </Button>
            </Link>
          </div>

          {/* Extension status */}
          <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-display text-on-surface">Extension</h3>
              <Badge variant="muted">Chrome</Badge>
            </div>
            <p className="text-xs text-on-surface-muted">
              Install the AutoApply Chrome extension to start auto-filling job applications.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              Get Extension
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
