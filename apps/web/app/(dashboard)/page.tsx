import { createClient } from '@/lib/supabase/server'
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

  // Stage badge styles — monochrome jobos style
  function getStageBadge(status: string): { bg: string; text: string; border: string; label: string } {
    switch (status) {
      case 'oa':          return { bg: 'bg-white/10', text: 'text-white/90', border: 'border-white/20', label: 'OA' }
      case 'interviewing':return { bg: 'bg-white/15', text: 'text-white', border: 'border-white/25', label: 'Interview' }
      case 'offer':       return { bg: 'bg-white', text: 'text-black', border: 'border-transparent', label: 'Offer' }
      case 'rejected':    return { bg: 'bg-[#151515]', text: 'text-white/35', border: 'border-white/5', label: 'Rejected' }
      default:            return { bg: 'bg-white/5', text: 'text-white/80', border: 'border-white/10', label: 'Applied' }
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl lg:text-4xl font-light font-serif-lux italic text-white tracking-wide">
          Identity Dashboard
        </h2>
        <p className="text-xs text-white/45 mt-1 uppercase tracking-wider">
          Precision overview of active job applications, interview sequences, and portfolio configurations.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Active Applications</span>
            <span className="material-symbols-outlined text-white/55 group-hover:scale-105 transition-transform text-[18px]">description</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-light font-serif-lux text-white">{total}</span>
            {readinessPct > 0 && <span className="text-white/40 text-[9px] font-medium ml-2.5 bg-white/5 px-2 py-0.5 rounded border border-white/5">{readinessPct}% READY</span>}
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all group relative">
          <div className="flex justify-between items-start">
            <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Interviews Status</span>
            <span className="material-symbols-outlined text-white/55 group-hover:scale-105 transition-transform text-[18px]">groups</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-light font-serif-lux text-white">{interviews}</span>
            <span className="text-white/40 text-[9px] font-medium ml-2.5 bg-white/5 px-2 py-0.5 rounded border border-white/5">{interviews > 0 ? `+${interviews} SCHEDULED` : 'NONE YET'}</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all group relative">
          <div className="flex justify-between items-start">
            <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">OAs Pending</span>
            <span className="material-symbols-outlined text-white/55 group-hover:scale-105 transition-transform text-[18px]">code</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-light font-serif-lux text-white">{oas}</span>
            <span className="text-white/35 text-[9px] ml-2 font-mono">DUE SOON</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all group relative">
          <div className="flex justify-between items-start">
            <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Active Offers</span>
            <span className="material-symbols-outlined text-white/55 group-hover:scale-105 transition-transform text-[18px]">military_tech</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-light font-serif-lux text-white">{offers}</span>
            <span className="text-white/30 text-[9px] font-medium ml-2.5 uppercase tracking-wide">CYCLE RECORD</span>
          </div>
        </div>
      </section>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Applications — 8 cols */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 className="text-sm font-medium text-white tracking-widest uppercase flex items-center gap-2.5">
              <span>RECENT APPLICATION FEEDS</span>
              <span className="bg-white/5 text-white/70 text-[8px] px-2 py-0.5 rounded border border-white/10 font-bold tracking-widest animate-pulse">
                LIVE PIPELINE
              </span>
            </h2>
          </div>

          {recentApps.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-10 text-center">
              <p className="text-white/40 text-sm">No applications yet. Use the extension to auto-fill your first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => {
                const company = (app.job as { company?: string } | null)?.company ?? 'Unknown'
                const title = (app.job as { title?: string } | null)?.title ?? 'Unknown Role'
                const badge = getStageBadge(app.status)
                const initial = company.replace(/↳/g, '').trim().slice(0, 1).toUpperCase() || '?'
                return (
                  <div
                    key={app.id}
                    className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#0f0f0f] hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#151515] border border-white/5 flex items-center justify-center font-bold text-sm text-white/80 shrink-0">
                        {initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-xs text-white">{title}</span>
                          <span className="text-[10px] text-white/30">•</span>
                          <span className="text-xs text-white/70 font-semibold">{company}</span>
                        </div>
                        <p className="text-[11px] text-white/45 mt-0.5">
                          Active tracking enabled
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <p className="text-[9px] text-white/35 mt-1 tracking-wider">
                          {timeAgo(app.applied_at ?? app.last_activity_at ?? new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Activity Registry — 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60">Activity Registry</h2>
          <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {activityApps.length === 0 ? (
                <p className="text-[11px] text-white/30 italic text-center py-8">No activity yet.</p>
              ) : activityApps.map((app, i) => {
                const company = (app.job as { company?: string } | null)?.company ?? 'Unknown'
                const status = app.status ?? 'applied'
                const labels: Record<string, string> = {
                  applied: `Applied to ${company}`,
                  oa: `OA from ${company}`,
                  interviewing: `Interview at ${company}`,
                  offer: `Offer from ${company}`,
                  rejected: `Rejected by ${company}`,
                  saved: `Saved ${company}`,
                }
                return (
                  <div key={i} className="flex gap-2.5 relative pb-2.5 border-b border-white/[0.03]">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] text-white/80 leading-relaxed">{labels[status] ?? `Updated ${company}`}</p>
                      <span className="text-[9px] text-white/30 font-mono block mt-1">
                        {timeAgo(app.applied_at ?? app.last_activity_at ?? new Date().toISOString())}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 font-mono text-[9px] text-white/30 space-y-0.5">
              <p className="text-white/40">[SYS] Sync channel authorized.</p>
              <p>[SYS] Port 3000 SSL certificate secure.</p>
              <p className="text-white/40">[SYS] Standard client sync complete.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
