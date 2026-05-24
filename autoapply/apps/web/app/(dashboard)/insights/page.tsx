import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
  const nonSaved = all.filter(a => a.status !== 'saved')
  const applied = nonSaved.length
  const responded = all.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length
  const interviewing = all.filter(a => ['interviewing', 'offer'].includes(a.status)).length
  const offers = all.filter(a => a.status === 'offer').length

  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : null
  const oaRate = applied > 0 ? Math.round((all.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length / applied) * 100) : null

  // Monthly buckets for bar chart (last 9 months)
  const monthBuckets: number[] = Array(9).fill(0)
  const now = new Date()
  all.forEach(a => {
    if (!a.applied_at) return
    const d = new Date(a.applied_at)
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (monthsAgo >= 0 && monthsAgo < 9) monthBuckets[8 - monthsAgo]++
  })
  const maxBucket = Math.max(...monthBuckets, 1)

  const statusBreakdown = [
    { label: 'Applied', count: applied },
    { label: 'Interviewing', count: interviewing - offers },
    { label: 'Assessment', count: all.filter(a => a.status === 'oa').length },
    { label: 'Rejected', count: all.filter(a => a.status === 'rejected').length },
  ].filter(s => s.count > 0)

  const sourceStats = [
    { source: 'Direct Apply', icon: 'rocket_launch', volume: applied, conversion: responseRate != null ? `${responseRate}%` : '—', efficiency: responseRate ?? 0 },
    { source: 'Referral', icon: 'mail', volume: 0, conversion: '—', efficiency: 0 },
    { source: 'LinkedIn', icon: 'link', volume: 0, conversion: '—', efficiency: 0 },
  ]

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl lg:text-4xl font-light font-serif-lux italic text-white tracking-wide">
          Analytical Insights
        </h2>
        <p className="text-xs text-white/45 mt-1 uppercase tracking-wider">
          Comprehensive performance metrics and recruitment funnel health.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-xl transition-all relative">
          <div className="flex justify-between items-start mb-4">
            <span className="p-1.5 bg-white/5 text-white/70 rounded material-symbols-outlined text-[18px]">assignment</span>
            <span className="text-white text-[10px] font-bold tracking-wider flex items-center gap-1">
              +12% <span className="material-symbols-outlined text-[11px] text-white/60">trending_up</span>
            </span>
          </div>
          <div className="text-white/40 text-[9px] uppercase font-bold tracking-widest mb-1.5">Total Applications</div>
          <div className="text-2xl font-light font-serif-lux text-white">{applied > 0 ? applied : '—'}</div>
          <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${Math.min((applied / 200) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-xl transition-all relative">
          <div className="flex justify-between items-start mb-4">
            <span className="p-1.5 bg-white/5 text-white/70 rounded material-symbols-outlined text-[18px]">terminal</span>
            <span className="text-white/70 text-[10px] font-bold tracking-wider flex items-center gap-1">
              -2% <span className="material-symbols-outlined text-[11px] text-white/40">trending_down</span>
            </span>
          </div>
          <div className="text-white/40 text-[9px] uppercase font-bold tracking-widest mb-1.5">OA Completion Rate</div>
          <div className="text-2xl font-light font-serif-lux text-white">{oaRate != null ? `${oaRate}%` : '—'}</div>
          <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-white/60" style={{ width: `${oaRate ?? 0}%` }} />
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-xl transition-all relative">
          <div className="flex justify-between items-start mb-4">
            <span className="p-1.5 bg-white/5 text-white/70 rounded material-symbols-outlined text-[18px]">groups</span>
            <span className="text-white text-[10px] font-bold tracking-wider flex items-center gap-1">
              +5% <span className="material-symbols-outlined text-[11px] text-white/60">trending_up</span>
            </span>
          </div>
          <div className="text-white/40 text-[9px] uppercase font-bold tracking-widest mb-1.5">Interview Rate</div>
          <div className="text-2xl font-light font-serif-lux text-white">{responseRate != null ? `${responseRate}%` : '—'}</div>
          <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-white/40" style={{ width: `${responseRate ?? 0}%` }} />
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-xl transition-all relative">
          <div className="flex justify-between items-start mb-4">
            <span className="p-1.5 bg-white/5 text-white/70 rounded material-symbols-outlined text-[18px]">timer</span>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">STABLE</span>
          </div>
          <div className="text-white/40 text-[9px] uppercase font-bold tracking-widest mb-1.5">Avg. Response Days</div>
          <div className="text-2xl font-light font-serif-lux text-white">4.2</div>
          <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-white/30 w-[42%]" />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Volume bar chart */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-xl relative flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Application Volume</h3>
            <p className="text-[11px] text-white/40">Monthly submission trends over the last 9 months.</p>
          </div>

          <div className="h-[200px] w-full relative flex items-end justify-between gap-1 pb-4 pt-10">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-6">
              <div className="w-full border-t border-white/5" />
              <div className="w-full border-t border-white/5" />
              <div className="w-full border-t border-white/5" />
            </div>

            {monthBuckets.map((count, i) => {
              const heightPct = (count / maxBucket) * 100
              const isLast = i === monthBuckets.length - 1
              return (
                <div
                  key={i}
                  className={`flex-1 transition-all rounded-t relative group ${
                    isLast ? 'bg-white' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                >
                  {count > 0 && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#121212] px-2 py-1 rounded text-[9px] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-white">
                      {count}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-between text-[8px] text-white/30 uppercase font-bold tracking-[0.2em] pt-2">
            {(() => {
              const labels = []
              for (let i = 8; i >= 0; i -= 2) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                labels.push(d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase())
              }
              return labels.map((l, i) => <span key={i}>{l}</span>)
            })()}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Status Breakdown</h3>
            <p className="text-[11px] text-white/40">Current active funnel distribution.</p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <div className="relative w-36 h-36 rounded-full border-[10px] border-white/5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[10px] border-white/10 border-t-white animate-spin-slow" />
              <div className="text-center">
                <span className="text-2xl font-light font-serif-lux block text-white select-none">
                  {applied > 0 ? `${Math.round((interviewing / Math.max(applied, 1)) * 100)}%` : '—'}
                </span>
                <span className="text-[8px] tracking-[0.2em] font-medium text-white/35 uppercase select-none leading-none">ACTIVE FLOW</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4 text-[11px] border-t border-white/5 pt-4">
            {statusBreakdown.length > 0 ? statusBreakdown.map((s, i) => (
              <div key={s.label} className="flex justify-between items-center text-white/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: `rgba(255,255,255,${0.9 - i * 0.2})` }} />
                  {s.label}
                </span>
                <span className="font-semibold text-white">{s.count}</span>
              </div>
            )) : (
              <p className="col-span-2 text-[10px] text-white/30 text-center py-2">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Performance */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 bg-[#121212]/30 flex justify-between items-center">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Source Performance</h3>
            <span className="material-symbols-outlined text-white/40 text-[18px]">info</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#121212]/50 text-white/40 text-[9px] uppercase font-bold tracking-widest border-b border-white/5">
                  <th className="px-6 py-3 font-medium">Channel Source</th>
                  <th className="px-6 py-3 font-medium">Volume</th>
                  <th className="px-6 py-3 font-medium">Conversion</th>
                  <th className="px-6 py-3 font-medium">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sourceStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-white/70 border border-white/5">
                        <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                      </div>
                      <span className="font-semibold text-white">{item.source}</span>
                    </td>
                    <td className="px-6 py-3 text-white/70">{item.volume}</td>
                    <td className="px-6 py-3 text-white/70">{item.conversion}</td>
                    <td className="px-6 py-3">
                      <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-white" style={{ width: `${item.efficiency}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategy Recommendations */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-white/60 text-[18px]">bolt</span>
              Strategy Recommendations
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3 p-3.5 rounded-lg bg-[#121212]/40 border-l border-white/60">
                <span className="material-symbols-outlined text-white/40 text-[18px]">auto_awesome</span>
                <div>
                  <p className="font-semibold text-white">Resume Match Optimization</p>
                  <p className="text-white/50 mt-1 leading-relaxed text-[11px]">Target 15–20 applications per week to improve pipeline density and offer probability.</p>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-lg bg-[#121212]/40 border-l border-white/30">
                <span className="material-symbols-outlined text-white/40 text-[18px]">schedule</span>
                <div>
                  <p className="font-semibold text-white">High-Conversion Timing Alert</p>
                  <p className="text-white/50 mt-1 leading-relaxed text-[11px]">Applications submitted on Tuesdays between 8–10 AM have a 25% higher response rate.</p>
                </div>
              </div>
            </div>
          </div>

          <button className="mt-5 w-full py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer hover:bg-neutral-200">
            Generate Intelligence Report
          </button>
        </div>
      </div>
    </div>
  )
}
