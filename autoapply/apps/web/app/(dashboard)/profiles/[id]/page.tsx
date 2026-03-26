import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplicationProfileForm } from '@/components/profiles/ApplicationProfileForm'
import type { ApplicationProfile } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProfileEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Handle "new" profile creation
  if (id === 'new') {
    const { data: newProfile, error } = await supabase
      .from('application_profiles')
      .insert({
        user_id: user.id,
        name: 'Untitled Profile',
        is_default: false,
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        languages: [],
      })
      .select()
      .single()

    if (error || !newProfile) {
      redirect('/profiles')
    }

    redirect(`/profiles/${newProfile.id}`)
  }

  const { data: profile } = await supabase
    .from('application_profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/profiles')

  const typedProfile = profile as ApplicationProfile

  return (
    <div>
      <div className="px-8 pt-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold font-display text-on-surface">
          {typedProfile.name}
        </h1>
      </div>
      <ApplicationProfileForm profile={typedProfile} />
    </div>
  )
}
