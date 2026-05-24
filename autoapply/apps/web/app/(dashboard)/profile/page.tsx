import { createClient } from '@/lib/supabase/server'
import { BaseIdentityForm } from '@/components/profile/BaseIdentityForm'
import { RegionalIdentityList } from '@/components/profile/RegionalIdentityList'
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

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-light font-serif-lux italic text-white tracking-wide">
            Identity Management
          </h2>
          <p className="text-xs text-white/45 mt-1 uppercase tracking-wider">
            Configure your core and regional persona parameters for automated job matching.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-1.5 border border-white/10 hover:bg-white/5 transition-all rounded text-[10px] font-semibold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Export Data
          </button>
        </div>
      </div>

      {/* BASE IDENTITY */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40 text-[18px]">fingerprint</span>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">BASE IDENTITY</h3>
        </div>
        <div className="bg-[#0a0a0a] rounded-xl p-8 border border-white/5 relative overflow-hidden">
          <BaseIdentityForm initial={baseIdentity} />
        </div>
      </section>

      {/* REGIONAL IDENTITIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white/40 text-[18px]">public</span>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">REGIONAL IDENTITIES</h3>
          </div>
          {regional.length > 0 && (
            <span className="text-[10px] text-white/35 uppercase tracking-widest">{regional.length} Active Region{regional.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <RegionalIdentityList initial={regional} />
      </section>

      {/* Readiness / Encryption footer */}
      {!hasName || !hasRegional ? (
        <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
            <span className="material-symbols-outlined text-white/60 text-[20px]">warning</span>
          </div>
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider">Profile Incomplete</h5>
            <p className="text-[11px] text-white/45 mt-1 leading-relaxed">
              Add {[!hasName && 'your first name', !hasRegional && 'at least one regional identity'].filter(Boolean).join(' and ')} to enable auto-fill.
            </p>
          </div>
        </div>
      ) : null}

      {/* Persona Encryption */}
      <div className="bg-[#0a0a0a] border border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 border border-white/5">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <div>
            <h5 className="font-semibold text-xs text-white uppercase tracking-wider">Persona Encryption Active</h5>
            <p className="text-[11px] text-white/45 mt-1 leading-relaxed">
              All regional bios, CV parameters, and credentials are encrypted on device memory.
            </p>
          </div>
        </div>
        <button className="text-[10px] uppercase font-bold tracking-widest text-white/80 hover:text-white shrink-0">
          Verify Keys
        </button>
      </div>
    </div>
  )
}
