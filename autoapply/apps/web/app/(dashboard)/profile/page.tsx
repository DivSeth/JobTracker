import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { BaseIdentityForm } from '@/components/profile/BaseIdentityForm'
import { RegionalIdentityList } from '@/components/profile/RegionalIdentityList'
import { redirect } from 'next/navigation'
import { MatIcon } from '@/components/ui/mat-icon'

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
  const missingItems = [
    !hasName && 'your first name',
    !hasRegional && 'at least one regional identity',
  ].filter(Boolean) as string[]

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-4 py-8">
      {/* Readiness banner */}
      {ready ? (
        <div className="flex items-center gap-3 rounded-xl border border-success-vibrant/20 bg-success-vibrant/10 px-4 py-3">
          <MatIcon size={16} className="text-success-vibrant shrink-0">check_circle</MatIcon>
          <p className="text-sm text-success-vibrant font-medium">
            Profile complete — the extension can auto-fill applications.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-warning-vibrant/20 bg-warning-vibrant/10 px-4 py-3">
          <MatIcon size={16} className="text-warning-vibrant shrink-0 mt-0.5">warning</MatIcon>
          <div>
            <p className="text-sm font-medium text-warning-vibrant">Profile incomplete</p>
            <p className="text-xs text-warning-vibrant/80 mt-0.5">
              Add {missingItems.join(' and ')} to enable auto-fill.
            </p>
          </div>
        </div>
      )}

      {/* Base Identity */}
      <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-base font-semibold font-display text-on-surface">Base Identity</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Personal details, online presence, and logistics</p>
        </div>
        <div className="p-6">
          <BaseIdentityForm initial={baseIdentity} />
        </div>
      </div>

      {/* Regional Identities */}
      <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-base font-semibold font-display text-on-surface">Regional Identities</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Country-specific contact, work authorization, and compensation</p>
        </div>
        <div className="p-6">
          <RegionalIdentityList initial={regional} />
        </div>
      </div>

      {/* Fill Preferences */}
      <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-base font-semibold font-display text-on-surface">Fill Preferences</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">EEO, background check, and other application defaults</p>
        </div>
        <div className="p-6">
          <ProfileForm initialProfile={profileRes.data ?? {}} />
        </div>
      </div>
    </div>
  )
}
