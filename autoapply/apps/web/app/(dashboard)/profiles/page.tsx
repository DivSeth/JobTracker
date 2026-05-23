import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileListClient } from '@/components/profiles/ProfileListClient'
import type { ApplicationProfile } from '@/lib/types'
import { MatIcon } from '@/components/ui/mat-icon'

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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">Application Profiles</h1>
          <p className="text-sm text-on-surface-variant mt-1">Role-specific profiles for auto-filling ATS applications.</p>
        </div>
        <Link
          href="/profiles/new"
          className="flex items-center gap-2 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <MatIcon size={16}>add</MatIcon>
          New Profile
        </Link>
      </div>

      {profileList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center mb-4">
            <MatIcon size={20} className="text-outline">add</MatIcon>
          </div>
          <h2 className="text-lg font-semibold font-display text-on-surface mb-2">No profiles yet</h2>
          <p className="text-sm text-on-surface-variant max-w-sm mb-6">
            Create your first application profile to start auto-filling. Upload a resume to get started.
          </p>
          <Link
            href="/profiles/new"
            className="flex items-center gap-2 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <ProfileListClient profiles={profileList} />
          <Link
            href="/profiles/new"
            className="rounded-xl border-2 border-dashed border-outline-variant hover:border-electric-indigo/40 hover:bg-electric-indigo/5 transition-colors p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] group"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-outline group-hover:border-electric-indigo/40 flex items-center justify-center transition-colors">
              <MatIcon size={18} className="text-outline group-hover:text-electric-indigo/60 transition-colors">add</MatIcon>
            </div>
            <span className="text-sm font-medium text-outline group-hover:text-on-surface transition-colors">New Profile</span>
          </Link>
        </div>
      )}
    </div>
  )
}
