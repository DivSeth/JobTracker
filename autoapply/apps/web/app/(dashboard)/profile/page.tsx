import { createClient } from '@/lib/supabase/server'
import { BaseIdentityForm } from '@/components/profile/BaseIdentityForm'
import { RegionalIdentityList } from '@/components/profile/RegionalIdentityList'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, regionalRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('user_regional_identities')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false }),
  ])

  const baseIdentity = profileRes.data ?? {}
  const regional = regionalRes.data ?? []
  const hasName = !!(baseIdentity as { first_name?: string | null }).first_name
  const hasRegional = regional.length > 0
  const ready = hasName && hasRegional

  return (
    <div className="p-8 pb-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-on-surface tracking-tight">Identity Management</h1>
            <p className="text-[14px] text-on-surface-variant mt-0.5">
              Configure your core and regional persona parameters for automated job matching.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-outline-variant hover:bg-surface-variant/30 transition-all rounded-lg text-[12px] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              Export Data
            </button>
          </div>
        </div>

        {/* Readiness indicator */}
        {ready ? (
          <div className="glass border-l-4 border-success-vibrant p-4 flex items-center gap-4 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-success-vibrant/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-success-vibrant text-[18px]">check_circle</span>
            </div>
            <p className="text-[13px] text-success-vibrant font-medium">
              Profile complete — the extension can auto-fill applications.
            </p>
          </div>
        ) : (
          <div className="glass border-l-4 border-warning-vibrant p-4 flex items-center gap-4 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-warning-vibrant/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-warning-vibrant text-[18px]">warning</span>
            </div>
            <p className="text-[13px] text-warning-vibrant font-medium">
              Profile incomplete — add {[!hasName && 'your first name', !hasRegional && 'at least one regional identity'].filter(Boolean).join(' and ')} to enable auto-fill.
            </p>
          </div>
        )}

        {/* Base Identity */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">fingerprint</span>
            <h3 className="text-[11px] font-bold text-primary tracking-[0.1em] uppercase">Base Identity</h3>
          </div>
          <div className="glass mesh-gradient rounded-xl p-6 border border-outline-variant/30 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full" />
            <BaseIdentityForm initial={baseIdentity} />
          </div>
        </section>

        {/* Regional Identities */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">public</span>
              <h3 className="text-[11px] font-bold text-secondary tracking-[0.1em] uppercase">Regional Identities</h3>
            </div>
            {regional.length > 0 && (
              <span className="text-[12px] text-on-surface-variant">{regional.length} Active Region{regional.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <RegionalIdentityList initial={regional} />
        </section>

        {/* Fill Preferences */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">tune</span>
            <h3 className="text-[11px] font-bold text-tertiary tracking-[0.1em] uppercase">Fill Preferences</h3>
          </div>
          <div className="glass mesh-gradient rounded-xl p-6 border border-outline-variant/30">
            <ProfileForm initialProfile={profileRes.data ?? {}} />
          </div>
        </section>

        {/* Security notice */}
        <div className="glass border-l-4 border-electric-indigo p-4 flex items-center gap-4 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-electric-indigo/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-electric-indigo text-[20px]">verified_user</span>
          </div>
          <div className="flex-1">
            <h5 className="text-[12px] font-bold text-on-surface">End-to-End Persona Encryption Active</h5>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              All regional bios and contact details are encrypted before being sent to job portals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
