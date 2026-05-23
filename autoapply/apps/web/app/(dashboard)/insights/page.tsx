import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, TrendingUp, CheckCircle, Trophy } from 'lucide-react'
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
  const offerRate = applied > 0 ? Math.round((offers / applied) * 100) : null

  const funnel = [
    { label: 'Applied',      count: applied,       color: 'bg-primary-container'   },
    { label: 'OA',           count: all.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length, color: 'bg-warning-vibrant'     },
    { label: 'Interviewing', count: interviewing,   color: 'bg-deep-violet'          },
    { label: 'Offer',        count: offers,         color: 'bg-success-vibrant'      },
  ]
  const maxCount = Math.max(...funnel.map(f => f.count), 1)

  const { data: latestInsight } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  const statCards = [
    { label: 'Total Applied',  value: applied > 0 ? applied : '—',                        icon: BarChart2,  color: 'text-primary bg-primary/10'                  },
    { label: 'Response Rate',  value: responseRate != null ? `${responseRate}%` : '—',     icon: TrendingUp, color: 'text-warning-vibrant bg-warning-vibrant/10'   },
    { label: 'OA Rate',        value: oaRate != null ? `${oaRate}%` : '—',                 icon: CheckCircle,color: 'text-deep-violet bg-deep-violet/10'            },
    { label: 'Offer Rate',     value: offerRate != null ? `${offerRate}%` : '—',           icon: Trophy,     color: 'text-success-vibrant bg-success-vibrant/10'    },
  ]

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-on-surface">Insights</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {total === 0 ? 'Start applying to jobs to see your stats here.' : `Based on ${total} application${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-surface-card rounded-xl p-5 shadow-card border border-outline-variant flex flex-col gap-3 mesh-gradient-card">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-surface-card rounded-xl p-6 shadow-card border border-outline-variant">
        <h2 className="text-base font-semibold text-on-surface mb-5">Application Funnel</h2>
        <div className="space-y-3">
          {funnel.map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-sm text-on-surface-variant w-24 shrink-0">{f.label}</span>
              <div className="flex-1 h-6 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full ${f.color} rounded-full transition-all`}
                  style={{ width: `${(f.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-on-surface w-8 text-right">{f.count}</span>
            </div>
          ))}
        </div>
        {total === 0 && (
          <p className="text-sm text-outline/50 text-center mt-4">Apply to jobs to populate this funnel</p>
        )}
      </div>

      {/* Status breakdown */}
      {total > 0 && (
        <div className="bg-surface-card rounded-xl p-6 shadow-card border border-outline-variant">
          <h2 className="text-base font-semibold text-on-surface mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['saved', 'applied', 'oa', 'interviewing', 'offer', 'rejected', 'ghosted'] as const).map(status => {
              const count = all.filter(a => a.status === status).length
              if (count === 0) return null
              return (
                <div key={status} className="text-center">
                  <p className="text-xl font-bold text-on-surface">{count}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{status}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {latestInsight && (
        <div className="bg-surface-card rounded-xl p-6 shadow-card border border-outline-variant">
          <h2 className="text-base font-semibold text-on-surface mb-4">AI Insights</h2>
          <div className="space-y-3">
            {(latestInsight.insights as InsightItem[]).map((insight: InsightItem, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  insight.type === 'stat' ? 'bg-primary' :
                  insight.type === 'recommendation' ? 'bg-warning-vibrant' : 'bg-error-vibrant'
                }`} />
                <p className="text-sm text-on-surface">{insight.message}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-outline/50 mt-3">
            Week of {new Date(latestInsight.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  )
}
