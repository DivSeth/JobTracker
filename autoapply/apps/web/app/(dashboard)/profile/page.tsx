import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { BaseIdentityForm } from '@/components/profile/BaseIdentityForm'
import { RegionalIdentityList } from '@/components/profile/RegionalIdentityList'
import { redirect } from 'next/navigation'
import { CheckCircle, AlertTriangle } from 'lucide-react'

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
        <div className="flex items-center gap-3 rounded-card border border-success/20 bg-success/10 px-4 py-3">
          <CheckCircle size={16} className="text-success shrink-0" />
          <p className="text-sm text-success font-medium">
            Profile complete — the extension can auto-fill applications.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-card border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Profile incomplete</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Add {missingItems.join(' and ')} to enable auto-fill.
            </p>
          </div>
        </div>
      )}

      {/* Base Identity card */}
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold font-display text-on-surface">Base Identity</h2>
          <p className="text-xs text-on-surface-muted mt-0.5">
            Personal details, online presence, and logistics
          </p>
        </div>
        <div className="p-6">
          <BaseIdentityForm initial={baseIdentity} />
        </div>
      </div>

      {/* Regional Identities card */}
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold font-display text-on-surface">Regional Identities</h2>
          <p className="text-xs text-on-surface-muted mt-0.5">
            Country-specific contact, work authorization, and compensation
          </p>
        </div>
        <div className="p-6">
          <RegionalIdentityList initial={regional} />
        </div>
      </div>

      {/* Application Profile card */}
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold font-display text-on-surface">Fill Preferences</h2>
          <p className="text-xs text-on-surface-muted mt-0.5">
            EEO, background check, and other application defaults
          </p>
        </div>
        <div className="p-6">
          <ProfileForm initialProfile={profileRes.data ?? {}} />
        </div>
      </div>
    </div>
  )
}
