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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl lg:text-4xl font-light font-serif-lux italic text-white tracking-wide">
          Application Profiles
        </h2>
        <p className="text-xs text-white/45 mt-1 uppercase tracking-wider">
          Upload and configure your specialized CVs and Cover Letters for custom career targeting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CV Parser Panel (Left) */}
        <section className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">CV PARSER ENGINE</h3>

          <div className="border-2 border-dashed border-white/10 bg-[#0a0a0a] hover:border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[250px]">
            <span className="material-symbols-outlined text-4xl text-white/40 mb-3 animate-pulse">cloud_upload</span>
            <h4 className="font-semibold text-xs text-white">Drag & Drop Resume PDF</h4>
            <p className="text-[10px] text-white/50 px-4 mt-2 leading-relaxed">
              Drop any standard PDF/Word resume to parse skills and automatically build match scores.
            </p>
            <Link
              href="/profiles/new"
              className="mt-5 px-4 py-1.5 bg-white text-black hover:bg-neutral-200 font-medium text-[10px] uppercase tracking-widest rounded cursor-pointer transition-all"
            >
              Choose File
            </Link>
          </div>

          {/* Profile Optimization Indices */}
          <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5 space-y-4">
            <h4 className="font-semibold text-[10px] text-white/40 uppercase tracking-widest pb-2 border-b border-white/5">
              Profile Optimization Indices
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-white/65 mb-1">
                  <span>Resume SEO Strength</span>
                  <span className="font-bold text-white">—</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-0" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-white/65 mb-1">
                  <span>ATS Keyword Match Density</span>
                  <span className="font-bold text-white/80">—</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/50 w-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Cards (Right) */}
        <section className="lg:col-span-8 space-y-4">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Specialized Portfolios</h3>

          {profileList.length === 0 ? (
            <div className="bg-[#0a0a0a] rounded-xl p-10 border-2 border-dashed border-white/5 text-center">
              <div className="w-12 h-12 rounded-lg bg-[#121212] border border-white/5 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-white/40 text-[24px]">add</span>
              </div>
              <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-2">No profiles yet</h4>
              <p className="text-[10px] text-white/40 max-w-sm mx-auto mb-5">
                Create your first application profile to start auto-filling. Upload a resume to get started.
              </p>
              <Link
                href="/profiles/new"
                className="inline-flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Create Profile
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <ProfileListClient profiles={profileList} />

              <Link
                href="/profiles/new"
                className="group w-full flex items-center gap-4 bg-[#0a0a0a] rounded-xl p-5 border-2 border-dashed border-white/5 hover:border-white/20 hover:bg-white/[0.01] transition-all"
              >
                <div className="w-10 h-10 rounded bg-[#121212] border border-white/5 flex items-center justify-center text-white/50">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-white uppercase tracking-wider">Add Profile</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">Target a new role type or industry</p>
                </div>
              </Link>
            </div>
          )}

          {total > 0 && (
            <p className="text-[9px] text-white/30 uppercase tracking-widest">{total} active profile{total !== 1 ? 's' : ''} in pipeline</p>
          )}
        </section>
      </div>
    </div>
  )
}
