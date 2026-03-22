import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  async function saveProfile(data: Partial<Profile>) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles')
      .upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Skills listed here are used to score job relevance. Be specific — use
        technology names rather than categories (e.g. &quot;React&quot; not &quot;frontend&quot;).
      </p>
      <ProfileForm initialData={profile ?? undefined} onSubmit={saveProfile} />
    </div>
  )
}
