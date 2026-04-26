import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileListClient } from '@/components/profiles/ProfileListClient'
import type { ApplicationProfile } from '@/lib/types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
          <h1 className="text-2xl font-bold font-display text-on-surface">
            Application Profiles
          </h1>
          <p className="text-sm text-on-surface-muted mt-1">
            Role-specific profiles for auto-filling ATS applications.
          </p>
        </div>
        <Link href="/profiles/new">
          <Button variant="primary" size="md">New Profile</Button>
        </Link>
      </div>

      {profileList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-card border-2 border-dashed border-border-subtle flex items-center justify-center mb-4">
            <Plus size={20} className="text-on-surface-muted/40" />
          </div>
          <h2 className="text-lg font-semibold font-display text-on-surface mb-2">
            No profiles yet
          </h2>
          <p className="text-sm text-on-surface-muted max-w-sm mb-6">
            Create your first application profile to start auto-filling. Upload a resume to get started.
          </p>
          <Link href="/profiles/new">
            <Button variant="primary" size="md">Create Profile</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <ProfileListClient profiles={profileList} />

          {/* Ghost "New Profile" card */}
          <Link
            href="/profiles/new"
            className="rounded-card border-2 border-dashed border-border-subtle hover:border-primary/30 hover:bg-primary/5 transition-colors p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] group"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-on-surface-muted/20 group-hover:border-primary/40 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-on-surface-muted/40 group-hover:text-primary/60 transition-colors" />
            </div>
            <span className="text-sm font-medium text-on-surface-muted group-hover:text-on-surface transition-colors">
              New Profile
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
