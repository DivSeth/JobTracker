import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { InsightItem } from '@/lib/types'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: apps } = await supabase
    .from('applications')
    .select('status, applied_at, last_activity_at')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  const all = apps ?? []
  const total = all.length
  const nonSaved = all.filter(a => a.status !== 'saved')
  const applied = nonSaved.length
  const responded = all.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length
  const interviewing = all.filter(a => ['interviewing', 'offer'].includes(a.status)).length
  const offers = all.filter(a => a.status === 'offer').length

  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : null
  const oaRate = applied > 0 ? Math.round((all.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length / applied) * 100) : null

  // Monthly buckets for bar chart (last 10 months)
  const monthBuckets: number[] = Array(10).fill(0)
  const now = new Date()
  all.forEach(a => {
    if (!a.applied_at) return
    const d = new Date(a.applied_at)
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (monthsAgo >= 0 && monthsAgo < 10) {
      monthBuckets[9 - monthsAgo]++
    }
  })
  const maxBucket = Math.max(...monthBuckets, 1)

  const { data: latestInsight } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  const kpiCards = [
    {
      label: 'Total Applications', value: applied > 0 ? applied : '—', delta: null, trend: 'up',
      icon: 'assignment', color: 'text-primary', iconBg: 'bg-primary/10',
      barColor: 'var(--primary)', barBg: 'rgba(164,200,255,0.15)', barGlow: 'rgba(164,200,255,0.4)',
      pct: Math.min((applied / 200) * 100, 100),
    },
    {
      label: 'OA Completion Rate', value: oaRate != null ? `${oaRate}%` : '—', delta: null, trend: 'down',
      icon: 'terminal', color: 'text-secondary', iconBg: 'bg-secondary/10',
      barColor: 'var(--secondary)', barBg: 'rgba(192,193,255,0.15)', barGlow: 'rgba(192,193,255,0.4)',
      pct: oaRate ?? 0,
    },
    {
      label: 'Interview Rate', value: responseRate != null ? `${responseRate}%` : '—', delta: null, trend: 'up',
      icon: 'groups', color: 'text-electric-indigo', iconBg: 'bg-electric-indigo/10',
      barColor: 'var(--electric-indigo)', barBg: 'rgba(99,102,241,0.15)', barGlow: 'rgba(99,102,241,0.4)',
      pct: responseRate ?? 0,
    },
    {
      label: 'Avg. Response Days', value: '4.2', delta: null, trend: 'stable',
      icon: 'timer', color: 'text-tertiary', iconBg: 'bg-tertiary/10',
      barColor: 'var(--tertiary)', barBg: 'rgba(221,183,255,0.15)', barGlow: 'rgba(221,183,255,0.4)',
      pct: 42,
    },
  ]

  const statusBreakdown = [
    { label: 'Applied', count: applied, color: '#a4c8ff' },
    { label: 'OA', count: all.filter(a => a.status === 'oa').length, color: '#f59e0b' },
    { label: 'Interviewing', count: interviewing - offers, color: '#a855f7' },
    { label: 'Offer', count: offers, color: '#22c55e' },
    { label: 'Rejected', count: all.filter(a => a.status === 'rejected').length, color: '#ef4444' },
  ].filter(s => s.count > 0)
  const totalForDonut = statusBreakdown.reduce((s, x) => s + x.count, 0) || 1

  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Analytical Insights</h1>
        <p className="text-[14px] text-on-surface-variant mt-0.5">
          {total === 0
            ? 'Start applying to jobs to see your stats here.'
            : 'Comprehensive performance metrics and recruitment funnel health.'}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon, color, iconBg, barColor, barBg, barGlow, pct, trend }) => (
          <div key={label} className="glass p-5 rounded-xl mesh-gradient relative overflow-hidden group border-glow-hover transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none opacity-30" style={{ background: barColor }} />
            <div className="flex items-center gap-3 mb-3 relative">
              <div className={`p-2 ${iconBg} ${color} rounded-lg`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </div>
              <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-[28px] font-bold text-on-surface relative mb-1">{value}</p>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold uppercase ${trend === 'up' ? 'text-success-vibrant' : trend === 'down' ? 'text-error-vibrant' : 'text-outline'}`}>
                {trend === 'stable' ? 'STABLE' : total === 0 ? 'NO DATA' : trend === 'up' ? 'TRACKING' : 'BELOW AVG'}
              </span>
            </div>
            <div className="h-1 w-full rounded-full overflow-hidden relative" style={{ background: barBg }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 8px ${barGlow}` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application volume bar chart */}
        <div className="lg:col-span-2 glass rounded-xl p-5 border border-outline-variant/30">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[16px] font-semibold text-on-surface">Application Volume</h3>
              <p className="text-[12px] text-on-surface-variant">Monthly application trend</p>
            </div>
            <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
              {['W', 'M', 'Q'].map(t => (
                <button key={t} className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${t === 'M' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-primary'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-[6px] h-32">
            {monthBuckets.map((count, i) => {
              const heightPct = (count / maxBucket) * 100
              const isLast = i === monthBuckets.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm transition-all" style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    background: isLast
                      ? 'var(--primary-container)'
                      : 'rgba(99,102,241,0.25)',
                    boxShadow: isLast ? '0 0 8px rgba(77,159,255,0.4)' : 'none',
                  }} />
                </div>
              )
            })}
          </div>
          <div className="flex items-end gap-[6px] mt-1">
            {monthBuckets.map((count, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-outline font-medium">
                {count > 0 ? count : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="glass rounded-xl p-5 border border-outline-variant/30">
          <div className="mb-5">
            <h3 className="text-[16px] font-semibold text-on-surface">Status Breakdown</h3>
            <p className="text-[12px] text-on-surface-variant">Current pipeline state</p>
          </div>
          {total > 0 ? (
            <>
              {/* Simple donut-ish ring */}
              <div className="flex items-center justify-center mb-5">
                <div className="relative w-24 h-24">
                  <div
                    className="w-24 h-24 rounded-full"
                    style={{
                      background: `conic-gradient(${statusBreakdown.map((s, i) => {
                        const pct = (s.count / totalForDonut) * 360
                        const prev = statusBreakdown.slice(0, i).reduce((a, x) => a + (x.count / totalForDonut) * 360, 0)
                        return `${s.color} ${prev}deg ${prev + pct}deg`
                      }).join(', ')})`,
                    }}
                  />
                  <div className="absolute inset-3 bg-surface-container-low rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[14px] font-bold text-on-surface">{applied}</p>
                      <p className="text-[9px] text-outline uppercase">Active</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {statusBreakdown.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-[12px] text-on-surface-variant">{s.label}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-on-surface">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-[12px] text-outline text-center">Apply to jobs to see your pipeline breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        {latestInsight && (
          <div className="glass rounded-xl p-5 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
              <h3 className="text-[16px] font-semibold text-on-surface">AI Recommendations</h3>
            </div>
            <div className="space-y-3">
              {(latestInsight.insights as InsightItem[]).map((insight: InsightItem, i: number) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                  insight.type === 'stat' ? 'bg-primary/5 border-primary' :
                  insight.type === 'recommendation' ? 'bg-warning-vibrant/5 border-warning-vibrant' :
                  'bg-error-vibrant/5 border-error-vibrant'
                }`}>
                  <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                    insight.type === 'stat' ? 'text-primary' :
                    insight.type === 'recommendation' ? 'text-warning-vibrant' : 'text-error-vibrant'
                  }`}>
                    {insight.type === 'stat' ? 'bar_chart' : insight.type === 'recommendation' ? 'lightbulb' : 'warning'}
                  </span>
                  <p className="text-[12px] text-on-surface">{insight.message}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-outline mt-3">
              Week of {new Date(latestInsight.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        )}

        {/* Strategy recommendations */}
        <div className="glass rounded-xl p-5 border border-outline-variant/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-electric-indigo text-[20px]">psychology</span>
            <h3 className="text-[16px] font-semibold text-on-surface">Strategy Recommendations</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: 'trending_up', color: 'border-primary text-primary bg-primary/5', title: 'Increase application volume', body: 'Target 15-20 applications per week to improve pipeline density and offer probability.' },
              { icon: 'school', color: 'border-electric-indigo text-electric-indigo bg-electric-indigo/5', title: 'Strengthen OA preparation', body: 'Complete 2-3 timed LeetCode sessions weekly. Focus on system design for L5+ roles.' },
              { icon: 'people', color: 'border-success-vibrant text-success-vibrant bg-success-vibrant/5', title: 'Leverage referral network', body: 'Reach out to 5 LinkedIn connections at target companies for warm introductions.' },
            ].map(r => (
              <div key={r.title} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${r.color}`}>
                <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0`}>{r.icon}</span>
                <div>
                  <p className="text-[12px] font-semibold text-on-surface">{r.title}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
