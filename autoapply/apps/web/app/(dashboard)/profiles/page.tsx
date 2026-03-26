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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold font-display text-on-surface">
            Application Profiles
          </h1>
          <p className="text-sm text-on-surface-muted mt-1">
            Create role-specific profiles to auto-fill job applications across ATS platforms.
          </p>
        </div>
        <Link
          href="/profiles/new"
          className="h-9 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dim inline-flex items-center hover:opacity-90 transition-opacity shrink-0"
        >
          Create Profile
        </Link>
      </div>

      {/* Profile grid or empty state */}
      {profileList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-lg font-semibold font-display text-on-surface mb-2">
            No profiles yet
          </h2>
          <p className="text-sm text-on-surface-muted max-w-sm mb-6">
            Create your first application profile to start auto-filling job applications. Upload a resume to get started quickly.
          </p>
          <Link
            href="/profiles/new"
            className="h-9 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dim inline-flex items-center hover:opacity-90 transition-opacity"
          >
            Create Profile
          </Link>
        </div>
      ) : (
        <ProfileListClient profiles={profileList} />
      )}
    </div>
  )
}
