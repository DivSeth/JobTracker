import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile, applications, scores, emails, deadlines, insights] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('applications').select('*, job:jobs(title, company, location)').eq('user_id', user.id),
    supabase.from('job_scores').select('*').eq('user_id', user.id),
    supabase.from('email_queue').select('id, subject, sender, classification, created_at').eq('user_id', user.id),
    supabase.from('deadlines').select('*').eq('user_id', user.id),
    supabase.from('insights').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    applications: applications.data,
    job_scores: scores.data,
    email_events: emails.data,
    deadlines: deadlines.data,
    insights: insights.data,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="autoapply-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
