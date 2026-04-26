import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
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

  const ready =
    !!(baseIdentity as { first_name?: string | null }).first_name && regional.length > 0

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      {ready ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
          All set — the extension can now fill applications.
        </div>
      ) : (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          Complete your name and add at least one region to enable auto-fill.
        </div>
      )}

      <BaseIdentityForm initial={baseIdentity} />

      <RegionalIdentityList initial={regional} />

      <ProfileForm initialProfile={profileRes.data ?? {}} />
    </div>
  )
}
