import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/gmail/refresh'
import { getHistoryMessages, fetchMessage } from '@/lib/gmail/client'

export async function POST(request: Request) {
  // Verify Pub/Sub token
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  const body = await request.json()
  const data = body.message?.data
  if (!data) return NextResponse.json({ ok: true })

  // Decode Pub/Sub message
  const decoded = JSON.parse(Buffer.from(data, 'base64').toString())
  const emailAddress = decoded.emailAddress
  const historyId = decoded.historyId?.toString()

  if (!emailAddress || !historyId) return NextResponse.json({ ok: true })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find user by email via auth admin API
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const authUser = users?.find(u => u.email === emailAddress)
  if (!authUser) return NextResponse.json({ ok: true })

  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id, last_history_id')
    .eq('user_id', authUser.id)
    .single()

  if (!profile) return NextResponse.json({ ok: true })

  try {
    const accessToken = await getValidAccessToken(adminClient, profile.user_id)
    const startId = profile.last_history_id ?? historyId

    const messageIds = await getHistoryMessages(accessToken, startId)

    // Queue new messages
    for (const msgId of messageIds) {
      const { data: existing } = await adminClient
        .from('email_queue')
        .select('id')
        .eq('gmail_message_id', msgId)
        .maybeSingle()

      if (existing) continue

      const msg = await fetchMessage(accessToken, msgId)
      await adminClient.from('email_queue').insert({
        user_id: profile.user_id,
        gmail_message_id: msgId,
        subject: msg.subject,
        sender: msg.sender,
        body_preview: msg.bodyPreview,
        status: 'pending',
      })
    }

    // Update last_history_id
    await adminClient
      .from('profiles')
      .update({ last_history_id: historyId })
      .eq('user_id', profile.user_id)

    // Trigger processing (fire and forget)
    fetch(new URL('/api/gmail/process', request.url).toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: profile.user_id }),
    }).catch(() => {})
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return NextResponse.json({ ok: true })
}
