import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileListClient } from '@/components/profiles/ProfileListClient'
import type { ApplicationProfile } from '@/lib/types'

export default async function ApplicationProfilesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('application_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  const profileList: ApplicationProfile[] = profiles ?? []
  const total = profileList.length
  const defaults = profileList.filter(p => p.is_default).length
  const withResume = profileList.filter(p => (p as { resume_url?: string }).resume_url).length

  return (
    <div className="p-8 pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-on-surface">Application Profiles</h1>
            <p className="text-[14px] text-on-surface-variant mt-0.5">Role-specific profiles for auto-filling ATS applications.</p>
          </div>
          <Link
            href="/profiles/new"
            className="flex items-center gap-2 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg px-4 py-2.5 text-[13px] font-bold hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Profile
          </Link>
        </div>

        {/* Stat row */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Profiles', value: total, icon: 'apps', color: 'text-primary-container', barColor: '#4d9fff', pct: Math.min((total / 10) * 100, 100) },
              { label: 'Default Profiles', value: defaults, icon: 'star', color: 'text-warning-vibrant', barColor: '#f59e0b', pct: total > 0 ? (defaults / total) * 100 : 0 },
              { label: 'With Resume', value: withResume, icon: 'description', color: 'text-success-vibrant', barColor: '#22c55e', pct: total > 0 ? (withResume / total) * 100 : 0 },
            ].map(({ label, value, icon, color, barColor, pct }) => (
              <div key={label} className="bg-surface-card border border-white/5 p-4 rounded-xl mesh-gradient border-glow-hover transition-all duration-300">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">{label}</p>
                  <span className={`material-symbols-outlined ${color} text-[20px]`}>{icon}</span>
                </div>
                <h3 className="text-[28px] font-bold text-on-surface">{value}</h3>
                <div className="mt-3 h-1 w-full rounded-full overflow-hidden" style={{ background: `${barColor}25` }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}80` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profiles grid */}
        {profileList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center mb-5 bg-surface-container">
              <span className="material-symbols-outlined text-outline text-[28px]">add</span>
            </div>
            <h2 className="text-[18px] font-semibold text-on-surface mb-2">No profiles yet</h2>
            <p className="text-[13px] text-on-surface-variant max-w-sm mb-6">
              Create your first application profile to start auto-filling. Upload a resume to get started.
            </p>
            <Link
              href="/profiles/new"
              className="flex items-center gap-2 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg px-5 py-2.5 text-[13px] font-bold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <ProfileListClient profiles={profileList} />
            {/* Add new profile CTA card */}
            <Link
              href="/profiles/new"
              className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-outline-variant/40 hover:border-electric-indigo/50 hover:bg-electric-indigo/5 transition-all overflow-hidden min-h-[180px]"
            >
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-[24px]">add</span>
                </div>
                <h4 className="text-[16px] font-bold text-on-surface">Add Profile</h4>
                <p className="text-[12px] text-on-surface-variant text-center mt-1">Target a new role type or industry</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
