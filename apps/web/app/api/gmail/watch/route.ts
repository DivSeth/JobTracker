import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/gmail/refresh'
import { registerWatch } from '@/lib/gmail/client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const accessToken = await getValidAccessToken(adminClient, user.id)
    const topicName = `projects/${process.env.GCP_PROJECT_ID || 'autoapply-os'}/topics/autoapply-gmail-push`

    const result = await registerWatch(accessToken, topicName)

    await adminClient
      .from('profiles')
      .update({
        gmail_watch_expiry: new Date(parseInt(result.expiration)).toISOString(),
        last_history_id: result.historyId,
      })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true, expiration: result.expiration })
  } catch (err) {
    console.error('Watch registration failed:', err)
    return NextResponse.json({ error: 'Watch registration failed' }, { status: 500 })
  }
}
