import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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

const CARD_GRADIENTS = [
  'from-blue-600 to-indigo-800',
  'from-emerald-600 to-teal-800',
  'from-purple-600 to-pink-800',
  'from-orange-500 to-red-700',
  'from-cyan-500 to-blue-700',
  'from-violet-600 to-purple-800',
  'from-rose-600 to-pink-800',
  'from-amber-500 to-orange-700',
]

function companyGradient(company: string) {
  let hash = 0
  for (const c of company) hash = ((hash << 5) - hash) + c.charCodeAt(0)
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length]
}

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  applied:      { bg: 'bg-secondary/20',        text: 'text-secondary',        border: 'border-secondary/30',        label: 'Applied' },
  oa:           { bg: 'bg-warning-vibrant/20',   text: 'text-warning-vibrant',  border: 'border-warning-vibrant/30',  label: 'OA' },
  interviewing: { bg: 'bg-deep-violet/20',       text: 'text-deep-violet',      border: 'border-deep-violet/30',      label: 'Interview' },
  offer:        { bg: 'bg-success-vibrant/20',   text: 'text-success-vibrant',  border: 'border-success-vibrant/30',  label: 'Offer' },
  rejected:     { bg: 'bg-error-vibrant/20',     text: 'text-error-vibrant',    border: 'border-error-vibrant/30',    label: 'Rejected' },
  saved:        { bg: 'bg-outline/20',           text: 'text-outline',          border: 'border-outline/30',          label: 'Saved' },
  ghosted:      { bg: 'bg-outline/20',           text: 'text-outline',          border: 'border-outline/30',          label: 'Ghosted' },
}

const ACTIVITY_META: Record<string, { dot: string; category: string; label: (c: string) => string }> = {
  applied:      { dot: 'bg-electric-indigo', category: 'Submission',  label: c => `Applied to ${c}` },
  oa:           { dot: 'bg-warning-vibrant', category: 'Assessment',  label: c => `OA from ${c}` },
  interviewing: { dot: 'bg-deep-violet',     category: 'Interview',   label: c => `Interview at ${c}` },
  offer:        { dot: 'bg-success-vibrant', category: 'Offer',       label: c => `Offer from ${c}` },
  rejected:     { dot: 'bg-error-vibrant',   category: 'Rejection',   label: c => `Rejected by ${c}` },
  saved:        { dot: 'bg-outline',         category: 'Saved',       label: c => `Saved ${c}` },
}

const BASE_FIELDS = [
  'first_name', 'last_name', 'linkedin_url', 'github_url', 'portfolio_url',
  'date_of_birth', 'open_to_relocation', 'work_arrangement', 'available_from',
] as const

function computeReadinessPct(base: Record<string, unknown>, hasRegional: boolean): number {
  const filled = BASE_FIELDS.filter(f => base[f] !== null && base[f] !== undefined && base[f] !== '').length
  return Math.round(((filled + (hasRegional ? 1 : 0)) / (BASE_FIELDS.length + 1)) * 100)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [appsRes, baseRes, regionalRes] = await Promise.all([
    supabase.from('applications').select('*, job:jobs(*)').eq('user_id', user!.id).order('last_activity_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
    supabase.from('user_regional_identities').select('id').eq('user_id', user!.id).limit(1),
  ])

  const applications = (appsRes.data ?? []) as ApplicationWithJob[]
  const base = (baseRes.data ?? {}) as Record<string, unknown>
  const hasRegional = (regionalRes.data ?? []).length > 0

  const total = applications.length
  const oas = applications.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length
  const interviews = applications.filter(a => ['interviewing', 'offer'].includes(a.status)).length
  const offers = applications.filter(a => a.status === 'offer').length
  const readinessPct = computeReadinessPct(base, hasRegional)

  const recentApps = applications.slice(0, 6)
  const activityApps = applications.slice(0, 8)

  const statCards = [
    {
      label: 'Active Applications', value: total, sub: readinessPct > 0 ? `${readinessPct}% ready` : null,
      icon: 'near_me', color: 'text-primary-container',
      barColor: '#4d9fff', barBg: 'rgba(77,159,255,0.15)', barGlow: 'rgba(77,159,255,0.5)',
      pct: Math.min((total / 200) * 100, 100),
    },
    {
      label: 'OAs Received', value: oas, sub: total > 0 ? `${Math.round(oas / total * 100)}% rate` : 'No apps yet',
      icon: 'code', color: 'text-electric-indigo',
      barColor: '#6366f1', barBg: 'rgba(99,102,241,0.15)', barGlow: 'rgba(99,102,241,0.5)',
      pct: total > 0 ? Math.round(oas / total * 100) : 0,
    },
    {
      label: 'Interviews', value: interviews, sub: interviews > 0 ? `+${interviews} this cycle` : 'None yet',
      icon: 'event_repeat', color: 'text-deep-violet',
      barColor: '#a855f7', barBg: 'rgba(168,85,247,0.15)', barGlow: 'rgba(168,85,247,0.5)',
      pct: total > 0 ? Math.round(interviews / total * 100) : 0,
    },
    {
      label: 'Offers', value: offers, sub: offers > 0 ? 'In review' : 'None yet',
      icon: 'verified', color: 'text-success-vibrant',
      barColor: '#22c55e', barBg: 'rgba(34,197,94,0.15)', barGlow: 'rgba(34,197,94,0.5)',
      pct: total > 0 ? Math.round(offers / total * 100) : 0,
    },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon, color, barColor, barBg, barGlow, pct }) => (
          <div key={label} className="bg-surface-card border border-white/5 p-4 rounded-xl mesh-gradient group border-glow-hover transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <p className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">{label}</p>
              <span className={`material-symbols-outlined ${color} text-[20px]`}>{icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[28px] font-bold text-on-surface">{value}</h3>
              {sub && <span className="text-[10px] font-bold text-on-surface-variant">{sub}</span>}
            </div>
            <div className="mt-4 h-1 w-full rounded-full overflow-hidden relative" style={{ background: barBg }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 8px ${barGlow}` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Applications — 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[18px] font-semibold text-on-surface">Recent Applications</h2>
            <Link href="/applications" className="text-[12px] text-primary hover:underline font-medium">
              View detailed log
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="bg-surface-card border border-white/5 rounded-xl p-10 text-center">
              <p className="text-on-surface-variant text-sm">No applications yet. Use the extension to auto-fill your first one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentApps.map((app) => {
                const company = (app.job as { company?: string } | null)?.company ?? 'Unknown'
                const title = (app.job as { title?: string } | null)?.title ?? 'Unknown Role'
                const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.saved
                const grad = companyGradient(company)
                const initial = company.replace(/↳/g, '').trim().slice(0, 1).toUpperCase() || '?'
                return (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="bg-surface-card border border-white/5 rounded-xl flex flex-col border-glow-hover group transition-all duration-300"
                  >
                    <div className="p-3 bg-surface-container rounded-t-xl flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-[18px] text-white shrink-0`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-on-surface text-[14px] leading-tight truncate">{title}</h4>
                          <p className="text-[12px] text-on-surface-variant mt-0.5 truncate">{company}</p>
                        </div>
                      </div>
                      <span className={`${badge.bg} ${badge.text} border ${badge.border} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest shrink-0`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-[12px] text-outline">{app.applied_at ? timeAgo(app.applied_at) : '—'}</span>
                      <div className="flex gap-1">
                        <div className="p-1.5 hover:bg-surface-variant rounded transition-colors text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </div>
                        <div className="p-1.5 hover:bg-surface-variant rounded transition-colors text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Live Activity — 4 cols */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container rounded-xl border border-white/5 p-5 flex flex-col" style={{ maxHeight: '520px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-on-surface">Live Activity</h2>
              <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-success-vibrant">
                <span className="w-2 h-2 rounded-full bg-success-vibrant animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4" style={{ overflowY: 'auto' }}>
              {activityApps.length === 0 ? (
                <p className="text-[12px] text-on-surface-variant text-center py-6">No activity yet.</p>
              ) : activityApps.map((app, i) => {
                const company = (app.job as { company?: string } | null)?.company ?? 'Unknown'
                const meta = ACTIVITY_META[app.status] ?? ACTIVITY_META.saved
                return (
                  <div key={i} className="border-l border-white/10 pl-4 relative py-1">
                    <div className={`absolute -left-[5px] top-2 w-2 h-2 rounded-full ${meta.dot}`} />
                    <p className="text-[12px] text-on-surface font-medium">{meta.label(company)}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-outline uppercase font-bold">{meta.category}</span>
                      <span className="text-[10px] text-outline">
                        {timeAgo(app.applied_at ?? app.last_activity_at ?? new Date().toISOString())}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
